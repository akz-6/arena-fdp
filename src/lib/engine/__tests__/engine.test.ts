import { describe, it, expect } from 'vitest';
import {
  createRng,
  randomInt,
  pick,
  shuffle,
  CARD_TIERS,
  TIE_SEVEN_CLUBS_SPADES,
  rollInitialLives,
  computeDecks,
  computeMaxCards,
  nextCards,
  nextDealer,
  generateRandomName,
  pickAvailableColor,
  TOON_NOUNS,
  TOON_ADJECTIVES,
  createInitialState,
  reduce,
  projectPublic,
  GameConfig,
  Player,
} from '../index';

describe('Engine: RNG Determinístico', () => {
  it('gera sequência determinística com a mesma seed', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    const s1 = [rng1(), rng1(), rng1()];
    const s2 = [rng2(), rng2(), rng2()];
    expect(s1).toEqual(s2);
  });

  it('respeita os limites inteiros inclusivos', () => {
    const rng = createRng(999);
    for (let i = 0; i < 50; i++) {
      const val = randomInt(3, 7, rng);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(7);
    }
    expect(randomInt(5, 2, rng)).toBe(5);
  });

  it('pick e shuffle funcionam e tratam erros', () => {
    const rng = createRng(123);
    const arr = [1, 2, 3, 4, 5];
    expect(() => {
      pick([], rng);
    }).toThrow();

    const p = pick(arr, rng);
    expect(arr).toContain(p);

    const shuf = shuffle(arr, rng);
    expect(shuf.length).toBe(arr.length);
    expect([...shuf].sort()).toEqual([...arr].sort());
  });
});

describe('Engine: Cartas e Hierarquia', () => {
  it('tem o 4 de Paus (Zap) como topo e os 4s comuns na base', () => {
    const base = CARD_TIERS[0];
    const top = CARD_TIERS[CARD_TIERS.length - 1];
    expect(base?.name).toBe('Quatros Comuns');
    expect(top?.nickname).toBe('Zap');
    expect(TIE_SEVEN_CLUBS_SPADES).toBe(true);
  });
});

describe('Engine: Vidas', () => {
  const baseConfig: GameConfig = {
    roomName: 'Teste',
    lifeVisibility: 'visible',
    lifeMode: 'fixed',
    lifeFixed: 5,
    lifeMin: 3,
    lifeMax: 7,
    lifeRandomScope: 'shared',
    hostRole: 'player',
    showHitCount: true,
    expectedPlayers: null,
    maxCardsCap: null,
    decks: 'auto',
    operatorMode: false,
  };

  it('gera vidas fixas corretamente', () => {
    const lives = rollInitialLives(baseConfig, ['p1', 'p2'], createRng(1));
    expect(lives).toEqual({ p1: 5, p2: 5 });
  });

  it('gera vidas aleatórias compartilhadas (shared)', () => {
    const config = { ...baseConfig, lifeMode: 'random' as const, lifeRandomScope: 'shared' as const };
    const lives = rollInitialLives(config, ['p1', 'p2', 'p3'], createRng(123));
    expect(lives.p1).toBe(lives.p2);
    expect(lives.p2).toBe(lives.p3);
    expect(lives.p1).toBeGreaterThanOrEqual(3);
    expect(lives.p1).toBeLessThanOrEqual(7);
  });

  it('gera vidas aleatórias individuais (individual)', () => {
    const config = { ...baseConfig, lifeMode: 'random' as const, lifeRandomScope: 'individual' as const };
    const lives = rollInitialLives(config, ['p1', 'p2', 'p3'], createRng(456));
    expect(lives.p1).toBeGreaterThanOrEqual(3);
    expect(lives.p2).toBeGreaterThanOrEqual(3);
    expect(lives.p3).toBeGreaterThanOrEqual(3);
  });
});

describe('Engine: Rodadas e Cartas', () => {
  const config: GameConfig = {
    roomName: 'Teste',
    lifeVisibility: 'visible',
    lifeMode: 'fixed',
    lifeFixed: 5,
    lifeMin: 3,
    lifeMax: 7,
    lifeRandomScope: 'shared',
    hostRole: 'player',
    showHitCount: true,
    expectedPlayers: null,
    maxCardsCap: null,
    decks: 'auto',
    operatorMode: false,
  };

  it('calcula baralhos automáticos: 1 para até 20 jogadores, 2 para 21, etc.', () => {
    expect(computeDecks(config, 4)).toBe(1);
    expect(computeDecks(config, 20)).toBe(1);
    expect(computeDecks(config, 21)).toBe(2);
    expect(computeDecks(config, 45)).toBe(3);
  });

  it('calcula teto de cartas: floor(40 * decks / vivos)', () => {
    expect(computeMaxCards(config, 4, 1)).toBe(10);
    expect(computeMaxCards(config, 10, 1)).toBe(4);
    expect(computeMaxCards({ ...config, maxCardsCap: 3 }, 4, 1)).toBe(3);
  });

  it('percorre a sequência de cartas: sobe até o teto, desce até 1, volta a subir', () => {
    // Teto 4: 1 -> 2 -> 3 -> 4 -> 3 -> 2 -> 1 -> 2 -> 3 -> 4...
    let state: { current: number; direction: import('../types').CardDirection; max: number } = {
      current: 1,
      direction: 'up',
      max: 4,
    };

    const expected = [2, 3, 4, 3, 2, 1, 2, 3, 4];
    for (const exp of expected) {
      const next = nextCards(state);
      expect(next.cards).toBe(exp);
      state = { current: next.cards, direction: next.direction, max: 4 };
    }
  });

  it('ajusta se o teto cair abaixo da contagem atual', () => {
    // Estava em 6 cartas, mas o teto caiu para 4
    const next = nextCards({ current: 6, direction: 'up', max: 4 });
    expect(next.cards).toBe(4);
    expect(next.direction).toBe('down');
  });

  it('rotaciona dealer pulando mortos e espectadores', () => {
    const players: Player[] = [
      { id: 'p1', name: 'P1', color: '#111', role: 'player', status: 'dead', joinOrder: 0 },
      { id: 'p2', name: 'P2', color: '#222', role: 'player', status: 'alive', joinOrder: 1 },
      { id: 'p3', name: 'P3', color: '#333', role: 'spectator', status: 'alive', joinOrder: 2 },
      { id: 'p4', name: 'P4', color: '#444', role: 'player', status: 'alive', joinOrder: 3 },
    ];

    expect(nextDealer(players, null)).toBe('p2');
    expect(nextDealer(players, 'p2')).toBe('p4');
    expect(nextDealer(players, 'p4')).toBe('p2'); // Volta para o primeiro vivo
  });
});

describe('Engine: Nomes e Cores', () => {
  it('gera nomes aleatórios únicos', () => {
    const rng = createRng(10);
    const name1 = generateRandomName([], rng);
    const name2 = generateRandomName([name1], rng);
    expect(name1).not.toBe(name2);
  });

  it('escolhe cor disponível na sala', () => {
    const rng = createRng(20);
    const color = pickAvailableColor(['#FF3038'], rng);
    expect(color.toLowerCase()).not.toBe('#ff3038');
  });
});

describe('Engine: Ciclo de Partida e Reducer', () => {
  const ctx = { now: 1000, rng: createRng(12345) };

  it('fluxo completo de 3 jogadores até a vitória', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host Rex', color: '#FF3038' },
      config: { lifeFixed: 2, lifeMode: 'fixed' },
    });

    // 1. Adiciona mais 2 jogadores
    const r1 = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'Pato', color: '#35B8F4' } }, ctx);
    state = r1.state;

    const r2 = reduce(state, { type: 'ADD_PLAYER', actorId: 'p3', player: { id: 'p3', name: 'Gato', color: '#FFC233' } }, ctx);
    state = r2.state;
    expect(state.players.length).toBe(3);

    // 2. Inicia partida (START)
    const rStart = reduce(state, { type: 'START', actorId: 'h1' }, ctx);
    state = rStart.state;
    expect(state.phase).toBe('round');
    expect(state.players[0]?.life).toBe(2);

    // 3. Fim da rodada 1 -> reporting
    state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, ctx).state;
    expect(state.phase).toBe('reporting');

    // 4. Reporte: p2 toma 2 de dano (vai morrer), h1 toma 0, p3 toma 0
    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p2', targetId: 'p2', damage: 2 }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;

    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'h1', targetId: 'h1', damage: 0 }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'h1' }, ctx).state;

    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p3', targetId: 'p3', damage: 0 }, ctx).state;
    // Ao último confirmar, fecha a rodada e vai para reveal
    const rClose1 = reduce(state, { type: 'CONFIRM', actorId: 'p3' }, ctx);
    state = rClose1.state;

    expect(state.phase).toBe('reveal');
    expect(state.players.find((p) => p.id === 'p2')?.status).toBe('dead');
    expect(state.players.find((p) => p.id === 'p2')?.life).toBe(0);

    // 5. Próxima rodada (rodada 2)
    state = reduce(state, { type: 'NEXT_ROUND', actorId: 'h1' }, ctx).state;
    expect(state.phase).toBe('round');
    expect(state.roundNumber).toBe(2);

    // 6. Rodada 2: encerra e p3 toma 2 de dano
    state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p3', targetId: 'p3', damage: 2 }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'p3' }, ctx).state;
    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'h1', targetId: 'h1', damage: 0 }, ctx).state;
    const rClose2 = reduce(state, { type: 'CONFIRM', actorId: 'h1' }, ctx);
    state = rClose2.state;

    // Apenas h1 sobrou vivo -> FIM DE JOGO
    expect(state.phase).toBe('finished');
    expect(state.winners).toEqual(['h1']);
  });

  it('empate: todos os vivos morrem na mesma rodada (C7)', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeFixed: 1 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, ctx).state;

    // Ambos levam 1 de dano
    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'h1', targetId: 'h1', damage: 1 }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p2', targetId: 'p2', damage: 1 }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;

    expect(state.phase).toBe('finished');
    expect(state.winners).toEqual(['h1', 'p2']); // Empate com todos que caíram
  });

  it('consenso de vida: aprovação unânime aplica delta', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeFixed: 3 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p3', player: { id: 'p3', name: 'P3', color: '#333' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;

    // p2 propõe +1 para p3
    const rProp = reduce(state, { type: 'PROPOSE_ADJUST', actorId: 'p2', targetId: 'p3', delta: 1 }, ctx);
    state = rProp.state;
    const propId = state.proposals[0]?.id || '';

    // h1 vota a favor
    state = reduce(state, { type: 'VOTE', actorId: 'h1', proposalId: propId, approve: true }, ctx).state;
    // p3 vota a favor (unanimidade dos demais vivos)
    state = reduce(state, { type: 'VOTE', actorId: 'p3', proposalId: propId, approve: true }, ctx).state;

    expect(state.proposals[0]?.status).toBe('approved');
    expect(state.players.find((p) => p.id === 'p3')?.life).toBe(4);
  });

  it('desfazer rodada (UNDO_LAST_ROUND)', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeFixed: 3 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, ctx).state;

    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p2', targetId: 'p2', damage: 2 }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'h1' }, ctx).state;

    expect(state.phase).toBe('reveal');
    expect(state.players.find((p) => p.id === 'p2')?.life).toBe(1);

    // Desfaz a rodada
    state = reduce(state, { type: 'UNDO_LAST_ROUND', actorId: 'h1' }, ctx).state;
    expect(state.phase).toBe('reporting');
    expect(state.players.find((p) => p.id === 'p2')?.life).toBe(3); // Vida restaurada!
  });

  it('entrada tardia pós-START entra como espectador', () => {
    let state = createInitialState({ host: { id: 'h1', name: 'Host', color: '#111' } });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;

    // p3 entra no meio do jogo
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p3', player: { id: 'p3', name: 'Atrasado', color: '#333' } }, ctx).state;
    const late = state.players.find((p) => p.id === 'p3');
    expect(late?.role).toBe('spectator');
  });
});

describe('Engine: Segurança e Projeção Pública', () => {
  it('NUNCA vaza o campo "life" quando lifeVisibility = hidden', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeVisibility: 'hidden', lifeFixed: 5 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, { now: 1, rng: createRng(1) }).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, { now: 2, rng: createRng(2) }).state;

    const projected = projectPublic(state);
    const json = JSON.stringify(projected);

    // O campo "life" NÃO pode existir no JSON público!
    expect(json).not.toMatch(/"life":/);
    expect(projected.players[0]).not.toHaveProperty('life');
    expect(projected.players[1]).not.toHaveProperty('life');
  });

  it('mantém o campo "life" quando lifeVisibility = visible', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeVisibility: 'visible', lifeFixed: 5 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, { now: 1, rng: createRng(1) }).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, { now: 2, rng: createRng(2) }).state;

    const projected = projectPublic(state);
    expect(projected.players[0]?.life).toBe(5);
  });
});

describe('Engine: Simulação de Monte Carlo (500 Partidas)', () => {
  it('500 partidas completas sempre terminam sem erros e com vencedor válido', () => {
    const rng = createRng(88888);

    for (let sim = 0; sim < 500; sim++) {
      let state = createInitialState({
        host: { id: 'h1', name: 'H1', color: '#111' },
        config: {
          lifeMode: sim % 2 === 0 ? 'fixed' : 'random',
          lifeFixed: 3,
          lifeMin: 2,
          lifeMax: 5,
        },
        seed: sim,
      });

      state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, { now: sim, rng }).state;
      state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p3', player: { id: 'p3', name: 'P3', color: '#333' } }, { now: sim, rng }).state;
      state = reduce(state, { type: 'START', actorId: 'h1' }, { now: sim, rng }).state;

      let safety = 0;
      while (state.phase !== 'finished' && safety < 100) {
        safety++;
        if (state.phase === 'round') {
          state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, { now: sim, rng }).state;
        } else if (state.phase === 'reporting') {
          const alive = state.players.filter((p) => p.status === 'alive' && p.role === 'player');
          for (const p of alive) {
            const damage = Math.floor(rng() * 2); // 0 ou 1
            state = reduce(state, { type: 'SET_DAMAGE', actorId: p.id, targetId: p.id, damage }, { now: sim, rng }).state;
            state = reduce(state, { type: 'CONFIRM', actorId: p.id }, { now: sim, rng }).state;
          }
        } else if (state.phase === 'reveal') {
          state = reduce(state, { type: 'NEXT_ROUND', actorId: 'h1' }, { now: sim, rng }).state;
        }
      }

      // Verificações invariantes
      expect(state.phase).toBe('finished');
      expect(state.winners).not.toBeNull();
      expect(state.winners?.length).toBeGreaterThan(0);
      for (const p of state.players) {
        if (p.life !== undefined) {
          expect(p.life).toBeGreaterThanOrEqual(0); // NUNCA negativa
        }
      }
    }
  });
});

describe('Engine: Ações do Host e Regras Especiais', () => {
  const ctx = { now: 5000, rng: createRng(777) };

  it('permite HOST_ADJUST direto (cura e dano letal)', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeFixed: 3 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;

    // Cura +1
    state = reduce(state, { type: 'HOST_ADJUST', actorId: 'h1', targetId: 'p2', delta: 1 }, ctx).state;
    expect(state.players.find((p) => p.id === 'p2')?.life).toBe(4);

    // Dano que zera vida -> morte e fim de jogo
    state = reduce(state, { type: 'HOST_ADJUST', actorId: 'h1', targetId: 'p2', delta: -1 }, ctx).state;
    state = reduce(state, { type: 'HOST_ADJUST', actorId: 'h1', targetId: 'p2', delta: -1 }, ctx).state;
    state = reduce(state, { type: 'HOST_ADJUST', actorId: 'h1', targetId: 'p2', delta: -1 }, ctx).state;
    state = reduce(state, { type: 'HOST_ADJUST', actorId: 'h1', targetId: 'p2', delta: -1 }, ctx).state;

    const p2 = state.players.find((p) => p.id === 'p2');
    expect(p2?.status).toBe('dead');
    expect(p2?.life).toBe(0);
    expect(state.phase).toBe('finished');
    expect(state.winners).toEqual(['h1']);
  });

  it('permite FORCE_CLOSE pelo host com jogadores pendentes', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeFixed: 3 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, ctx).state;

    // h1 reporta 1, p2 não reporta nada
    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'h1', targetId: 'h1', damage: 1 }, ctx).state;
    // Host força fechamento
    state = reduce(state, { type: 'FORCE_CLOSE', actorId: 'h1' }, ctx).state;

    expect(state.phase).toBe('reveal');
    expect(state.players.find((p) => p.id === 'h1')?.life).toBe(2);
    expect(state.players.find((p) => p.id === 'p2')?.life).toBe(3); // Dano 0 padrão
  });

  it('transfere host manualmente e automaticamente se o host sair', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p3', player: { id: 'p3', name: 'P3', color: '#333' } }, ctx).state;

    // Transferência manual
    state = reduce(state, { type: 'TRANSFER_HOST', actorId: 'h1', newHostId: 'p2' }, ctx).state;
    expect(state.hostId).toBe('p2');

    // Transferência automática se p2 (atual host) sair
    state = reduce(state, { type: 'LEAVE', actorId: 'p2' }, ctx).state;
    expect(state.hostId).toBe('h1'); // h1 é o vivo mais antigo
  });

  it('gerencia status away com SET_AWAY', () => {
    let state = createInitialState({ host: { id: 'h1', name: 'Host', color: '#111' } });
    state = reduce(state, { type: 'SET_AWAY', actorId: 'h1', isAway: true }, ctx).state;
    expect(state.players[0]?.status).toBe('away');
    state = reduce(state, { type: 'SET_AWAY', actorId: 'h1', isAway: false }, ctx).state;
    expect(state.players[0]?.status).toBe('alive');
  });

  it('atualiza configurações no lobby e rejeita fora dele', () => {
    let state = createInitialState({ host: { id: 'h1', name: 'Host', color: '#111' } });
    state = reduce(state, { type: 'UPDATE_CONFIG', actorId: 'h1', config: { lifeFixed: 7 } }, ctx).state;
    expect(state.config.lifeFixed).toBe(7);

    // Não-host tentando alterar
    expect(() => {
      reduce(state, { type: 'UPDATE_CONFIG', actorId: 'fake', config: { lifeFixed: 8 } }, ctx);
    }).toThrow();
  });

  it('rejeição de proposta de consenso cancela a proposta', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeFixed: 3 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;

    state = reduce(state, { type: 'PROPOSE_ADJUST', actorId: 'p2', targetId: 'h1', delta: 1 }, ctx).state;
    const propId = state.proposals[0]?.id || '';

    // h1 rejeita
    state = reduce(state, { type: 'VOTE', actorId: 'h1', proposalId: propId, approve: false }, ctx).state;
    expect(state.proposals[0]?.status).toBe('rejected');
    expect(state.players.find((p) => p.id === 'h1')?.life).toBe(3); // Inalterado
  });

  it('permite revanche (REMATCH) após finalizar partida', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeFixed: 1 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p2', targetId: 'p2', damage: 1 }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'h1' }, ctx).state;

    expect(state.phase).toBe('finished');

    // Host pede revanche
    state = reduce(state, { type: 'REMATCH', actorId: 'h1' }, ctx).state;
    expect(state.phase).toBe('lobby');
    expect(state.players.every((p) => p.status === 'alive')).toBe(true);
    expect(state.roundNumber).toBe(0);
  });

  it('validações e erros de regras estritas', () => {
    const state = createInitialState({ host: { id: 'h1', name: 'Host', color: '#111' } });

    // Nome curto
    expect(() => {
      reduce(state, { type: 'ADD_PLAYER', actorId: 'x', player: { id: 'x', name: 'A', color: '#222' } }, ctx);
    }).toThrow();

    // Nome duplicado
    expect(() => {
      reduce(state, { type: 'ADD_PLAYER', actorId: 'x', player: { id: 'x', name: 'HOST', color: '#222' } }, ctx);
    }).toThrow();

    // START com < 2 jogadores
    expect(() => {
      reduce(state, { type: 'START', actorId: 'h1' }, ctx);
    }).toThrow();

    // START por não-host
    expect(() => {
      reduce(state, { type: 'START', actorId: 'p2' }, ctx);
    }).toThrow();
  });

  it('projectPublic oculta dano quando showHitCount = false em vida oculta', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { lifeVisibility: 'hidden', showHitCount: false, lifeFixed: 3 },
    });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'h1', targetId: 'h1', damage: 1 }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;

    const projected = projectPublic(state);
    expect(projected.lastReveal?.hits[0]?.damage).toBeNull();
    expect(projected.lastReveal?.hits[0]?.died).toBe(false);
  });
});

describe('Engine: Cobertura Extra das Regras', () => {
  const ctx = { now: 6000, rng: createRng(9999) };

  it('cobre ramos adicionais de rounds.ts', () => {
    // computeDecks com número
    const configDecks = {
      roomName: 'T',
      lifeVisibility: 'visible' as const,
      lifeMode: 'fixed' as const,
      lifeFixed: 5,
      lifeMin: 3,
      lifeMax: 7,
      lifeRandomScope: 'shared' as const,
      hostRole: 'player' as const,
      showHitCount: true,
      expectedPlayers: null,
      maxCardsCap: null,
      decks: 3 as const,
      operatorMode: false,
    };
    expect(computeDecks(configDecks, 4)).toBe(3);

    // computeMaxCards com vivos = 0
    expect(computeMaxCards(configDecks, 0, 1)).toBe(1);

    // nextCards com teto 1
    expect(nextCards({ current: 1, direction: 'up', max: 1 })).toEqual({ cards: 1, direction: 'up' });

    // nextCards descendo quando current <= 1
    expect(nextCards({ current: 1, direction: 'down', max: 5 })).toEqual({ cards: 2, direction: 'up' });

    // nextDealer com lista vazia ou dealer inexistente
    expect(nextDealer([], null)).toBeNull();
    const pAlive = [{ id: 'x', name: 'X', color: '#111', role: 'player' as const, status: 'alive' as const, joinOrder: 0 }];
    expect(nextDealer(pAlive, 'non-existent')).toBe('x');
  });

  it('cobre ramos adicionais de reducer e names', () => {
    let state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { operatorMode: true },
    });

    // KICK de quem já está kicked
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;
    state = reduce(state, { type: 'KICK', actorId: 'h1', targetId: 'p2' }, ctx).state;
    const rKickAgain = reduce(state, { type: 'KICK', actorId: 'h1', targetId: 'p2' }, ctx);
    expect(rKickAgain.state.players.find((p) => p.id === 'p2')?.status).toBe('kicked');

    // SET_AWAY de jogador kicked
    const rAway = reduce(state, { type: 'SET_AWAY', actorId: 'p2', isAway: true }, ctx);
    expect(rAway.state.players.find((p) => p.id === 'p2')?.status).toBe('kicked');

    // Fallback de nomes e cores
    const fullOccupied = ['#FF3038', '#FF9500', '#FFC233', '#2ECC71', '#00C2A8', '#35B8F4', '#5B6CFF', '#8E5CF7', '#FF4FA3', '#8B5E3C', '#6B7280', '#111111'];
    const fallbackColor = pickAvailableColor(fullOccupied, ctx.rng);
    expect(fallbackColor).toBeDefined();

    // CONFIRM em operatorMode
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p3', player: { id: 'p3', name: 'P3', color: '#333' } }, ctx).state;
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'SET_DAMAGE', actorId: 'h1', targetId: 'p3', damage: 0 }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'h1' }, ctx).state;
    state = reduce(state, { type: 'CONFIRM', actorId: 'p3' }, ctx).state;
    expect(state.phase).toBe('reveal');
  });
});

describe('Engine: Barrel e Casos de Borda de Nomes/Reducer', () => {
  const ctx = { now: 7000, rng: createRng(1111) };

  it('cobre index.ts importando todos os módulos', async () => {
    const engineBarrel = await import('../index');
    expect(engineBarrel.CARD_TIERS).toBeDefined();
    expect(engineBarrel.reduce).toBeDefined();
  });

  it('cobre fallback de colisões extremas em names.ts', () => {
    const allCombos: string[] = [];
    for (const n of TOON_NOUNS) {
      for (const a of TOON_ADJECTIVES) {
        allCombos.push(`${n} ${a}`);
      }
    }
    const name = generateRandomName(allCombos, ctx.rng);
    expect(name).toMatch(/\d+/); // Contém sufixo numérico!
  });

  it('trata ação desconhecida no reducer retornando o estado inalterado', () => {
    const state = createInitialState({ host: { id: 'h1', name: 'Host', color: '#111' } });
    // @ts-expect-error testando ação inválida
    const result = reduce(state, { type: 'UNKNOWN_ACTION' }, ctx);
    expect(result.state).toBe(state);
  });
});

describe('Engine: Testes de Permissões e Erros de Ações do Host', () => {
  const ctx = { now: 8000, rng: createRng(555) };

  it('valida permissões de todas as ações exclusivas do host', () => {
    let state = createInitialState({ host: { id: 'h1', name: 'Host', color: '#111' } });
    state = reduce(state, { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } }, ctx).state;

    // KICK por não-host
    expect(() => reduce(state, { type: 'KICK', actorId: 'p2', targetId: 'h1' }, ctx)).toThrow();

    // TRANSFER_HOST por não-host ou com alvo inválido
    expect(() => reduce(state, { type: 'TRANSFER_HOST', actorId: 'p2', newHostId: 'h1' }, ctx)).toThrow();
    expect(() => reduce(state, { type: 'TRANSFER_HOST', actorId: 'h1', newHostId: 'ghost' }, ctx)).toThrow();

    // START
    state = reduce(state, { type: 'START', actorId: 'h1' }, ctx).state;

    // UPDATE_CONFIG fora do lobby
    expect(() => reduce(state, { type: 'UPDATE_CONFIG', actorId: 'h1', config: { lifeFixed: 9 } }, ctx)).toThrow();

    // END_ROUND por não-host
    expect(() => reduce(state, { type: 'END_ROUND', actorId: 'p2' }, ctx)).toThrow();
    state = reduce(state, { type: 'END_ROUND', actorId: 'h1' }, ctx).state;

    // FORCE_CLOSE por não-host
    expect(() => reduce(state, { type: 'FORCE_CLOSE', actorId: 'p2' }, ctx)).toThrow();
    state = reduce(state, { type: 'FORCE_CLOSE', actorId: 'h1' }, ctx).state;

    // NEXT_ROUND por não-host
    expect(() => reduce(state, { type: 'NEXT_ROUND', actorId: 'p2' }, ctx)).toThrow();

    // UNDO_LAST_ROUND por não-host ou sem snapshot
    expect(() => reduce(state, { type: 'UNDO_LAST_ROUND', actorId: 'p2' }, ctx)).toThrow();
    const withoutSnapshot = { ...state, prevSnapshot: null };
    expect(() => reduce(withoutSnapshot, { type: 'UNDO_LAST_ROUND', actorId: 'h1' }, ctx)).toThrow();

    // REMATCH por não-host
    expect(() => reduce(state, { type: 'REMATCH', actorId: 'p2' }, ctx)).toThrow();
  });
});
