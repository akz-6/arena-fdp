import { GameConfig, Player, CardDirection } from './types';

/**
 * Calcula o número de baralhos necessários.
 * Se 'auto', 1 baralho para cada 20 jogadores (mínimo 1).
 */
export function computeDecks(config: GameConfig, initialPlayers: number): number {
  if (typeof config.decks === 'number') {
    return Math.max(1, config.decks);
  }
  return Math.max(1, Math.ceil(initialPlayers / 20));
}

/**
 * Calcula o teto de cartas para a rodada atual.
 * Teto = floor(40 * baralhos / vivos), respeitando teto manual opcional.
 */
export function computeMaxCards(
  config: GameConfig,
  aliveCount: number,
  decks: number
): number {
  if (aliveCount <= 0) return 1;

  const autoMax = Math.max(1, Math.floor((40 * decks) / aliveCount));

  if (config.maxCardsCap && config.maxCardsCap > 0) {
    return Math.max(1, Math.min(autoMax, config.maxCardsCap));
  }

  return autoMax;
}

/**
 * Calcula a quantidade de cartas e direção da próxima rodada.
 * Regra: sobe até o teto, desce até 1, volta a subir. O 1 não repete.
 * Exemplo com teto 4: 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1...
 */
export function nextCards(params: {
  current: number;
  direction: CardDirection;
  max: number;
}): { cards: number; direction: CardDirection } {
  const { current, direction, max } = params;

  // Se o teto é 1, sempre permanece em 1
  if (max <= 1) {
    return { cards: 1, direction: 'up' };
  }

  // Se o teto caiu abaixo das cartas atuais (jogadores morreram)
  if (current > max) {
    return { cards: max, direction: 'down' };
  }

  if (direction === 'up') {
    if (current < max) {
      const nextVal = current + 1;
      return {
        cards: nextVal,
        direction: nextVal >= max ? 'down' : 'up',
      };
    } else {
      // Já estava no teto
      const nextVal = Math.max(1, max - 1);
      return {
        cards: nextVal,
        direction: nextVal <= 1 ? 'up' : 'down',
      };
    }
  } else {
    // direction === 'down'
    if (current > 1) {
      const nextVal = current - 1;
      return {
        cards: nextVal,
        direction: nextVal <= 1 ? 'up' : 'down',
      };
    } else {
      // Já estava em 1, volta a subir (o 1 não repete)
      const nextVal = Math.min(max, 2);
      return {
        cards: nextVal,
        direction: nextVal >= max ? 'down' : 'up',
      };
    }
  }
}

/**
 * Define o próximo jogador a distribuir as cartas (dealer rotativo).
 * Gira estritamente entre jogadores vivos com papel 'player', ordenados por joinOrder.
 */
export function nextDealer(
  players: readonly Player[],
  currentDealerId: string | null
): string | null {
  const eligible = players
    .filter((p) => p.status === 'alive' && p.role === 'player')
    .sort((a, b) => a.joinOrder - b.joinOrder);

  if (eligible.length === 0) return null;

  if (!currentDealerId) {
    const first = eligible[0];
    return first ? first.id : null;
  }

  const currentIndex = eligible.findIndex((p) => p.id === currentDealerId);
  if (currentIndex === -1) {
    const first = eligible[0];
    return first ? first.id : null;
  }

  const nextIndex = (currentIndex + 1) % eligible.length;
  const next = eligible[nextIndex];
  return next ? next.id : null;
}
