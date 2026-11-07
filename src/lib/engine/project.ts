import { GameState, Reveal } from './types';

export type PublicGameState = Omit<GameState, 'prevSnapshot'>;

/**
 * Projeta o estado público a partir do estado completo da engine.
 * Garante que vidas ocultas, snapshots de desfazer e danos pendentes
 * NUNCA vazem para o cliente.
 */
export function projectPublic(state: GameState): PublicGameState {
  // Em modo oculto, a vida só é revelada se a partida estiver completamente encerrada (phase === 'finished')
  // para compor a tabela de resumo final (C12 da planta). Em qualquer outra fase, a vida é rigorosamente omitida.
  const isHidden = state.config.lifeVisibility === 'hidden' && state.phase !== 'finished';

  // 1. Projeção dos jogadores (remove campo life se hidden)
  const projectedPlayers = state.players.map((player) => {
    const { life, ...rest } = player;
    if (!isHidden && life !== undefined) {
      return { ...rest, life };
    }
    return rest;
  });

  // 2. Projeção de revelação (oculta quantidade de dano se hidden e showHitCount for falso)
  let projectedReveal: Reveal | null = null;
  if (state.lastReveal) {
    const hideDamage = isHidden && !state.config.showHitCount;
    projectedReveal = {
      round: state.lastReveal.round,
      seed: state.lastReveal.seed,
      hits: state.lastReveal.hits.map((hit) => ({
        playerId: hit.playerId,
        died: hit.died,
        damage: hideDamage ? null : hit.damage,
      })),
    };
  }

  // 3. Projeção de danos pendentes: durante a fase de reporte, esconde os valores
  const projectedPendingDamage =
    state.phase === 'reporting' ? {} : { ...state.pendingDamage };

  // 4. Retorna estado público seguro, sem prevSnapshot mas com a flag booleana canUndo
  const safeState = { ...state };
  delete (safeState as { prevSnapshot?: unknown }).prevSnapshot;
  safeState.canUndo = Boolean(state.prevSnapshot);

  return {
    ...safeState,
    players: projectedPlayers,
    lastReveal: projectedReveal,
    pendingDamage: projectedPendingDamage,
    canUndo: Boolean(state.prevSnapshot),
  };
}
