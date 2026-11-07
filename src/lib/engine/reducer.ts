import {
  GameState,
  GameAction,
  GameEvent,
  EngineContext,
  GameConfig,
  Player,
  Proposal,
  Reveal,
  GameConfigSchema,
} from './types';
import { rollInitialLives } from './life';
import { computeDecks, computeMaxCards, nextCards, nextDealer } from './rounds';

/**
 * Cria o estado inicial de uma sala
 */
export function createInitialState(params: {
  host: { id: string; name: string; color: string };
  config?: Partial<GameConfig>;
  seed?: number;
}): GameState {
  const parsedConfig = GameConfigSchema.parse(params.config || {});
  const hostPlayer: Player = {
    id: params.host.id,
    name: params.host.name.trim(),
    color: params.host.color,
    role: parsedConfig.hostRole,
    status: 'alive',
    joinOrder: 0,
  };

  return {
    version: 0,
    phase: 'lobby',
    config: parsedConfig,
    players: [hostPlayer],
    hostId: params.host.id,
    dealerId: null,
    roundNumber: 0,
    cardsThisRound: 1,
    direction: 'up',
    pendingDamage: {},
    confirmed: [],
    lastReveal: null,
    proposals: [],
    winners: null,
    seed: params.seed ?? 123456789,
    prevSnapshot: null,
  };
}

/**
 * Reducer puro da engine de Arena FDP.
 * Sem I/O, determinístico via EngineContext (now, rng).
 */
export function reduce(
  state: GameState,
  action: GameAction,
  ctx: EngineContext
): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];

  switch (action.type) {
    // ----------------------------------------------------
    // ADD_PLAYER
    // ----------------------------------------------------
    case 'ADD_PLAYER': {
      const { player } = action;
      const cleanName = player.name.trim();

      if (cleanName.length < 2 || cleanName.length > 16) {
        throw new Error('O nome deve ter entre 2 e 16 caracteres');
      }

      // Validação de nome único (case-insensitive)
      const nameExists = state.players.some(
        (p) => p.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (nameExists) {
        throw new Error(`O nome "${cleanName}" já está em uso nesta sala`);
      }

      // Validação de cor única por sala (entre jogadores ativos)
      const colorTaken = state.players.some(
        (p) => p.status !== 'kicked' && p.color.toLowerCase() === player.color.toLowerCase()
      );
      if (colorTaken && state.players.length < 12) {
        throw new Error('Esta cor já foi escolhida por outro jogador');
      }

      // Limite de jogadores esperado
      if (
        state.config.expectedPlayers &&
        state.players.filter((p) => p.status !== 'kicked').length >= state.config.expectedPlayers
      ) {
        throw new Error('A sala atingiu a quantidade máxima de jogadores');
      }

      // Se a partida já começou, entra automaticamente como espectador
      const role =
        state.phase === 'lobby' ? player.role ?? 'player' : 'spectator';

      const newPlayer: Player = {
        id: player.id,
        name: cleanName,
        color: player.color,
        role,
        status: 'alive',
        joinOrder: state.players.length,
      };

      events.push({
        type: 'PLAYER_JOINED',
        playerId: newPlayer.id,
        name: newPlayer.name,
      });

      return {
        state: {
          ...state,
          version: state.version + 1,
          players: [...state.players, newPlayer],
        },
        events,
      };
    }

    // ----------------------------------------------------
    // KICK & LEAVE
    // ----------------------------------------------------
    case 'KICK':
    case 'LEAVE': {
      const isKick = action.type === 'KICK';
      const targetId = isKick ? action.targetId : action.actorId;

      if (isKick && action.actorId !== state.hostId) {
        throw new Error('Apenas o host pode expulsar jogadores');
      }

      const target = state.players.find((p) => p.id === targetId);
      if (!target || target.status === 'kicked') {
        return { state, events };
      }

      const updatedPlayers = state.players.map((p) =>
        p.id === targetId ? { ...p, status: 'kicked' as const } : p
      );

      // Se quem saiu/foi expulso era o host, transfere para o vivo mais antigo
      let newHostId = state.hostId;
      if (targetId === state.hostId) {
        const nextHostCandidate = updatedPlayers.find(
          (p) => p.status === 'alive' && p.role === 'player'
        );
        if (nextHostCandidate) {
          newHostId = nextHostCandidate.id;
          events.push({
            type: 'HOST_TRANSFERRED',
            fromHostId: state.hostId,
            toHostId: newHostId,
          });
        }
      }

      if (isKick) {
        events.push({ type: 'PLAYER_KICKED', playerId: targetId });
      }

      // Se o jogo está em andamento, verifica se restou apenas 1 vivo
      let nextPhase = state.phase;
      let nextWinners = state.winners;
      if (state.phase !== 'lobby' && state.phase !== 'finished') {
        const alivePlayers = updatedPlayers.filter(
          (p) => p.status === 'alive' && p.role === 'player'
        );
        if (alivePlayers.length <= 1) {
          nextPhase = 'finished';
          nextWinners = alivePlayers.map((p) => p.id);
          events.push({
            type: 'GAME_OVER',
            winners: nextWinners,
            isTie: alivePlayers.length === 0,
          });
        }
      }

      return {
        state: {
          ...state,
          version: state.version + 1,
          players: updatedPlayers,
          hostId: newHostId,
          phase: nextPhase,
          winners: nextWinners,
        },
        events,
      };
    }

    // ----------------------------------------------------
    // SET_AWAY
    // ----------------------------------------------------
    case 'SET_AWAY': {
      const { actorId, isAway } = action;
      const target = state.players.find((p) => p.id === actorId);
      if (!target || target.status === 'kicked' || target.status === 'dead') {
        return { state, events };
      }

      const updatedPlayers = state.players.map((p) =>
        p.id === actorId
          ? { ...p, status: isAway ? ('away' as const) : ('alive' as const) }
          : p
      );

      return {
        state: {
          ...state,
          version: state.version + 1,
          players: updatedPlayers,
        },
        events,
      };
    }

    // ----------------------------------------------------
    // START
    // ----------------------------------------------------
    case 'START': {
      if (action.actorId !== state.hostId) {
        throw new Error('Apenas o host pode iniciar a partida');
      }
      if (state.phase !== 'lobby') {
        throw new Error('A partida já foi iniciada');
      }

      const eligiblePlayers = state.players.filter(
        (p) => p.status === 'alive' && p.role === 'player'
      );
      if (eligiblePlayers.length < 2) {
        throw new Error('São necessários pelo menos 2 jogadores para iniciar');
      }

      // Sorteia vidas para os jogadores
      const initialLives = rollInitialLives(
        state.config,
        eligiblePlayers.map((p) => p.id),
        ctx.rng
      );

      const playersWithLives = state.players.map((p) => {
        if (p.role === 'player' && p.status === 'alive') {
          return {
            ...p,
            life: initialLives[p.id] ?? 5,
          };
        }
        return p;
      });

      const initialDealerId = nextDealer(playersWithLives, null);

      events.push({
        type: 'ROUND_STARTED',
        round: 1,
        cards: 1,
        dealerId: initialDealerId || '',
      });

      return {
        state: {
          ...state,
          version: state.version + 1,
          phase: 'round',
          players: playersWithLives,
          dealerId: initialDealerId,
          roundNumber: 1,
          cardsThisRound: 1,
          direction: 'up',
          pendingDamage: {},
          confirmed: [],
          lastReveal: null,
          proposals: [],
          winners: null,
          prevSnapshot: null,
        },
        events,
      };
    }

    // ----------------------------------------------------
    // END_ROUND (avança para reporting)
    // ----------------------------------------------------
    case 'END_ROUND': {
      if (action.actorId !== state.hostId && !state.config.operatorMode) {
        throw new Error('Apenas o host pode encerrar a rodada');
      }
      if (state.phase !== 'round') {
        throw new Error('Ação inválida fora da fase de rodada');
      }

      events.push({
        type: 'REPORTING_STARTED',
        round: state.roundNumber,
      });

      return {
        state: {
          ...state,
          version: state.version + 1,
          phase: 'reporting',
          pendingDamage: {},
          confirmed: [],
        },
        events,
      };
    }

    // ----------------------------------------------------
    // SET_DAMAGE
    // ----------------------------------------------------
    case 'SET_DAMAGE': {
      if (state.phase !== 'reporting') {
        throw new Error('Danos só podem ser reportados na fase de reporte');
      }

      const isHost = action.actorId === state.hostId;
      const isSelf = action.actorId === action.targetId;

      if (!isSelf && !(isHost && state.config.operatorMode)) {
        throw new Error('Você só pode definir seu próprio dano');
      }

      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || target.status !== 'alive' || target.role !== 'player') {
        throw new Error('Jogador inválido para reporte de dano');
      }

      if (
        typeof action.damage !== 'number' ||
        !Number.isFinite(action.damage) ||
        !Number.isInteger(action.damage) ||
        action.damage < 0
      ) {
        throw new Error('Dano deve ser um número inteiro maior ou igual a zero');
      }

      const damage = action.damage;

      // Se o jogador alterar o dano, remove da lista de confirmados
      const newConfirmed = state.confirmed.filter((id) => id !== action.targetId);

      return {
        state: {
          ...state,
          version: state.version + 1,
          pendingDamage: {
            ...state.pendingDamage,
            [action.targetId]: damage,
          },
          confirmed: newConfirmed,
        },
        events,
      };
    }

    // ----------------------------------------------------
    // CONFIRM
    // ----------------------------------------------------
    case 'CONFIRM': {
      if (state.phase !== 'reporting') {
        throw new Error('Confirmação só pode ocorrer na fase de reporte');
      }

      const alivePlayers = state.players.filter(
        (p) => p.status === 'alive' && p.role === 'player'
      );

      const target = alivePlayers.find((p) => p.id === action.actorId);
      if (!target && !(action.actorId === state.hostId && state.config.operatorMode)) {
        throw new Error('Jogador não elegível para confirmar');
      }

      const newConfirmed = Array.from(new Set([...state.confirmed, action.actorId]));

      // Verifica se TODOS os jogadores vivos confirmaram
      const allConfirmed = alivePlayers.every((p) => newConfirmed.includes(p.id));

      const intermediateState: GameState = {
        ...state,
        version: state.version + 1,
        confirmed: newConfirmed,
      };

      if (allConfirmed) {
        // Dispara fechamento e revelação da rodada
        return closeRound(intermediateState, ctx, events);
      }

      return {
        state: intermediateState,
        events,
      };
    }

    // ----------------------------------------------------
    // FORCE_CLOSE (Host força o fechamento)
    // ----------------------------------------------------
    case 'FORCE_CLOSE': {
      if (action.actorId !== state.hostId) {
        throw new Error('Apenas o host pode forçar o fechamento da rodada');
      }
      if (state.phase !== 'reporting') {
        throw new Error('Ação inválida fora da fase de reporte');
      }

      // Preenche com dano 0 quem não informou
      const updatedPending = { ...state.pendingDamage };
      const alivePlayers = state.players.filter(
        (p) => p.status === 'alive' && p.role === 'player'
      );
      for (const p of alivePlayers) {
        if (updatedPending[p.id] === undefined) {
          updatedPending[p.id] = 0;
        }
      }

      const intermediateState: GameState = {
        ...state,
        pendingDamage: updatedPending,
      };

      return closeRound(intermediateState, ctx, events);
    }

    // ----------------------------------------------------
    // NEXT_ROUND
    // ----------------------------------------------------
    case 'NEXT_ROUND': {
      if (action.actorId !== state.hostId) {
        throw new Error('Apenas o host pode avançar para a próxima rodada');
      }
      if (state.phase !== 'reveal') {
        throw new Error('Ação inválida fora da fase de revelação');
      }

      const alivePlayers = state.players.filter(
        (p) => p.status === 'alive' && p.role === 'player'
      );

      if (alivePlayers.length <= 1) {
        throw new Error('A partida já encerrou');
      }

      const decks = computeDecks(state.config, state.players.length);
      const maxCards = computeMaxCards(state.config, alivePlayers.length, decks);
      const { cards, direction } = nextCards({
        current: state.cardsThisRound,
        direction: state.direction,
        max: maxCards,
      });

      const nextDealerId = nextDealer(state.players, state.dealerId);
      const nextRound = state.roundNumber + 1;

      events.push({
        type: 'ROUND_STARTED',
        round: nextRound,
        cards,
        dealerId: nextDealerId || '',
      });

      return {
        state: {
          ...state,
          version: state.version + 1,
          phase: 'round',
          roundNumber: nextRound,
          cardsThisRound: cards,
          direction,
          dealerId: nextDealerId,
          pendingDamage: {},
          confirmed: [],
        },
        events,
      };
    }

    // ----------------------------------------------------
    // PROPOSE_ADJUST & VOTE (Consenso de Vida)
    // ----------------------------------------------------
    case 'PROPOSE_ADJUST': {
      const { actorId, targetId, delta } = action;

      const proposer = state.players.find((p) => p.id === actorId);
      const target = state.players.find((p) => p.id === targetId);

      if (!proposer || proposer.status !== 'alive' || proposer.role !== 'player') {
        throw new Error('Apenas jogadores vivos podem propor ajustes');
      }
      if (!target || target.status !== 'alive' || target.role !== 'player') {
        throw new Error('Alvo inválido para ajuste de vida');
      }

      const newProposal: Proposal = {
        id: `${ctx.now}-${Math.floor(ctx.rng() * 100000)}`,
        proposerId: actorId,
        targetId,
        delta,
        approvals: [actorId], // Proponente já aprova
        status: 'pending',
      };

      events.push({ type: 'PROPOSAL_CREATED', proposal: newProposal });

      return {
        state: {
          ...state,
          version: state.version + 1,
          proposals: [...state.proposals, newProposal],
        },
        events,
      };
    }

    case 'VOTE': {
      const { actorId, proposalId, approve } = action;
      const proposal = state.proposals.find((p) => p.id === proposalId);

      if (!proposal || proposal.status !== 'pending') {
        throw new Error('Proposta inválida ou já finalizada');
      }

      const voter = state.players.find((p) => p.id === actorId);
      if (!voter || voter.status !== 'alive' || voter.role !== 'player') {
        throw new Error('Apenas jogadores vivos podem votar');
      }

      // Se rejeitar, cancela a proposta imediatamente
      if (!approve) {
        const updatedProposals = state.proposals.map((p) =>
          p.id === proposalId ? { ...p, status: 'rejected' as const } : p
        );
        events.push({ type: 'PROPOSAL_RESOLVED', proposalId, status: 'rejected' });

        return {
          state: {
            ...state,
            version: state.version + 1,
            proposals: updatedProposals,
          },
          events,
        };
      }

      // Voto de aprovação
      const newApprovals = Array.from(new Set([...proposal.approvals, actorId]));
      const alivePlayers = state.players.filter(
        (p) => p.status === 'alive' && p.role === 'player'
      );

      // Todos os vivos devem aprovar (exceto o proponente que já aprovou)
      const allApproved = alivePlayers.every((p) => newApprovals.includes(p.id));

      if (allApproved) {
        // Aplica o ajuste de vida no alvo
        const target = state.players.find((p) => p.id === proposal.targetId);
        const currentLife = target?.life ?? 0;
        const newLife = Math.max(0, currentLife + proposal.delta);
        const died = newLife === 0 && currentLife > 0;

        const updatedPlayers = state.players.map((p) => {
          if (p.id === proposal.targetId) {
            return {
              ...p,
              life: newLife,
              status: died ? ('dead' as const) : p.status,
            };
          }
          return p;
        });

        if (died) {
          events.push({ type: 'PLAYER_DIED', playerId: proposal.targetId });
        }

        events.push({ type: 'PROPOSAL_RESOLVED', proposalId, status: 'approved' });

        const updatedProposals = state.proposals.map((p) =>
          p.id === proposalId ? { ...p, approvals: newApprovals, status: 'approved' as const } : p
        );

        // Checa se o ajuste de vida encerra o jogo
        const remainingAlive = updatedPlayers.filter(
          (p) => p.status === 'alive' && p.role === 'player'
        );
        let nextPhase = state.phase;
        let nextWinners = state.winners;

        if (state.phase !== 'lobby' && remainingAlive.length <= 1) {
          nextPhase = 'finished';
          nextWinners = remainingAlive.map((p) => p.id);
          events.push({
            type: 'GAME_OVER',
            winners: nextWinners,
            isTie: remainingAlive.length === 0,
          });
        }

        return {
          state: {
            ...state,
            version: state.version + 1,
            players: updatedPlayers,
            proposals: updatedProposals,
            phase: nextPhase,
            winners: nextWinners,
          },
          events,
        };
      }

      // Proposta ainda aguardando outros votos
      const updatedProposals = state.proposals.map((p) =>
        p.id === proposalId ? { ...p, approvals: newApprovals } : p
      );

      return {
        state: {
          ...state,
          version: state.version + 1,
          proposals: updatedProposals,
        },
        events,
      };
    }

    // ----------------------------------------------------
    // HOST_ADJUST (Ajuste direto do host)
    // ----------------------------------------------------
    case 'HOST_ADJUST': {
      if (action.actorId !== state.hostId) {
        throw new Error('Apenas o host pode aplicar ajustes diretos');
      }

      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || target.status !== 'alive' || target.role !== 'player') {
        throw new Error('Alvo inválido');
      }

      const currentLife = target.life ?? 0;
      const newLife = Math.max(0, currentLife + action.delta);
      const died = newLife === 0 && currentLife > 0;

      const updatedPlayers = state.players.map((p) => {
        if (p.id === action.targetId) {
          return {
            ...p,
            life: newLife,
            status: died ? ('dead' as const) : p.status,
          };
        }
        return p;
      });

      if (died) {
        events.push({ type: 'PLAYER_DIED', playerId: action.targetId });
      }

      // Checa fim de jogo se restou 1 ou 0 vivos
      const remainingAlive = updatedPlayers.filter(
        (p) => p.status === 'alive' && p.role === 'player'
      );
      let nextPhase = state.phase;
      let nextWinners = state.winners;

      if (state.phase !== 'lobby' && remainingAlive.length <= 1) {
        nextPhase = 'finished';
        nextWinners = remainingAlive.map((p) => p.id);
        events.push({
          type: 'GAME_OVER',
          winners: nextWinners,
          isTie: remainingAlive.length === 0,
        });
      }

      return {
        state: {
          ...state,
          version: state.version + 1,
          players: updatedPlayers,
          phase: nextPhase,
          winners: nextWinners,
        },
        events,
      };
    }

    // ----------------------------------------------------
    // TRANSFER_HOST
    // ----------------------------------------------------
    case 'TRANSFER_HOST': {
      if (action.actorId !== state.hostId) {
        throw new Error('Apenas o host atual pode transferir a liderança');
      }

      const candidate = state.players.find(
        (p) => p.id === action.newHostId && p.status !== 'kicked'
      );
      if (!candidate) {
        throw new Error('Novo host inválido');
      }

      events.push({
        type: 'HOST_TRANSFERRED',
        fromHostId: state.hostId,
        toHostId: action.newHostId,
      });

      return {
        state: {
          ...state,
          version: state.version + 1,
          hostId: action.newHostId,
        },
        events,
      };
    }

    // ----------------------------------------------------
    // UNDO_LAST_ROUND
    // ----------------------------------------------------
    case 'UNDO_LAST_ROUND': {
      if (action.actorId !== state.hostId) {
        throw new Error('Apenas o host pode desfazer a rodada');
      }
      if (!state.prevSnapshot) {
        throw new Error('Nenhuma rodada anterior disponível para desfazer');
      }

      const restoredRound = state.prevSnapshot.roundNumber;
      events.push({ type: 'ROUND_UNDONE', restoredRound });

      return {
        state: {
          ...state.prevSnapshot,
          version: state.version + 1,
          prevSnapshot: null, // Permite desfazer apenas 1 vez por rodada
        },
        events,
      };
    }

    // ----------------------------------------------------
    // REMATCH (Reiniciar partida mantendo configurações)
    // ----------------------------------------------------
    case 'REMATCH': {
      if (action.actorId !== state.hostId) {
        throw new Error('Apenas o host pode reiniciar a partida');
      }

      // Restaura jogadores para alive (exceto kicked)
      const resetPlayers = state.players.map((p) => {
        const copy = { ...p };
        delete copy.life;
        return {
          ...copy,
          status: p.status === 'kicked' ? ('kicked' as const) : ('alive' as const),
        };
      });

      return {
        state: {
          ...state,
          version: state.version + 1,
          phase: 'lobby',
          players: resetPlayers,
          dealerId: null,
          roundNumber: 0,
          cardsThisRound: 1,
          direction: 'up',
          pendingDamage: {},
          confirmed: [],
          lastReveal: null,
          proposals: [],
          winners: null,
          prevSnapshot: null,
        },
        events,
      };
    }

    // ----------------------------------------------------
    // UPDATE_CONFIG
    // ----------------------------------------------------
    case 'UPDATE_CONFIG': {
      if (action.actorId !== state.hostId) {
        throw new Error('Apenas o host pode alterar as configurações da sala');
      }
      if (state.phase !== 'lobby') {
        throw new Error('Configurações só podem ser alteradas no lobby');
      }

      const merged = GameConfigSchema.parse({
        ...state.config,
        ...action.config,
      });

      return {
        state: {
          ...state,
          version: state.version + 1,
          config: merged,
        },
        events,
      };
    }

    default:
      return { state, events };
  }
}

/**
 * Fecha a rodada de reporte, aplicando danos, mortes e determinando reveal ou fim de jogo.
 */
function closeRound(
  state: GameState,
  ctx: EngineContext,
  events: GameEvent[]
): { state: GameState; events: GameEvent[] } {
  // Salva snapshot pré-fechamento para desfazer
  const snapshotData = { ...state };
  delete (snapshotData as { prevSnapshot?: unknown }).prevSnapshot;

  const hits: Reveal['hits'] = [];

  const updatedPlayers = state.players.map((p) => {
    if (p.role !== 'player' || p.status !== 'alive') {
      return p;
    }

    const damage = state.pendingDamage[p.id] ?? 0;
    const currentLife = p.life ?? 0;
    const newLife = Math.max(0, currentLife - damage);
    const died = newLife === 0 && currentLife > 0;

    hits.push({
      playerId: p.id,
      appliedDamage: Math.min(currentLife, damage),
      damage,
      died,
    });

    if (damage > 0) {
      events.push({ type: 'DAMAGE_TAKEN', playerId: p.id, damage });
    }
    if (died) {
      events.push({ type: 'PLAYER_DIED', playerId: p.id });
    }

    return {
      ...p,
      life: newLife,
      status: died ? ('dead' as const) : p.status,
    };
  });

  const revealSeed = Math.floor(ctx.rng() * 1000000000);
  const reveal: Reveal = {
    round: state.roundNumber,
    seed: revealSeed,
    hits,
  };

  events.push({ type: 'ROUND_REVEALED', reveal });

  // Checa jogadores vivos
  const alivePlayers = updatedPlayers.filter(
    (p) => p.status === 'alive' && p.role === 'player'
  );

  let nextPhase: GameState['phase'] = 'reveal';
  let winners: string[] | null = null;

  if (alivePlayers.length === 1) {
    // 1 vencedor
    nextPhase = 'finished';
    const singleWinner = alivePlayers[0];
    winners = singleWinner ? [singleWinner.id] : [];
    events.push({ type: 'GAME_OVER', winners, isTie: false });
  } else if (alivePlayers.length === 0) {
    // Todos morreram na mesma rodada -> EMPATE com todos os que caíram agora (C7 da planta)
    nextPhase = 'finished';
    winners = hits.filter((h) => h.died).map((h) => h.playerId);
    events.push({ type: 'GAME_OVER', winners, isTie: true });
  }

  return {
    state: {
      ...state,
      version: state.version + 1,
      phase: nextPhase,
      players: updatedPlayers,
      lastReveal: reveal,
      winners,
      prevSnapshot: snapshotData,
    },
    events,
  };
}
