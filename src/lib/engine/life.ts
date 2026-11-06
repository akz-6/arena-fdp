import { GameConfig } from './types';
import { randomInt } from './rng';

/**
 * Sorteia ou define as vidas iniciais dos jogadores conforme a configuração.
 * Totalmente puro e determinístico via rng injetado.
 */
export function rollInitialLives(
  config: GameConfig,
  playerIds: string[],
  rng: () => number
): Record<string, number> {
  const result: Record<string, number> = {};

  if (config.lifeMode === 'fixed') {
    const fixedLife = Math.max(1, config.lifeFixed);
    for (const id of playerIds) {
      result[id] = fixedLife;
    }
    return result;
  }

  // Modo Aleatório
  const min = Math.max(1, config.lifeMin);
  const max = Math.max(min, config.lifeMax);

  if (config.lifeRandomScope === 'shared') {
    // Um sorteio compartilhado por todos
    const sharedRoll = randomInt(min, max, rng);
    for (const id of playerIds) {
      result[id] = sharedRoll;
    }
  } else {
    // Um sorteio individual por jogador
    for (const id of playerIds) {
      result[id] = randomInt(min, max, rng);
    }
  }

  return result;
}
