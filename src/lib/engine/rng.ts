/**
 * PRNG determinístico Mulberry32
 * Totalmente puro e reproduzível a partir de uma seed numérica.
 */

export function createRng(seed: number): () => number {
  let s = Math.floor(seed) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Retorna um inteiro uniforme no intervalo [min, max] inclusive
 */
export function randomInt(min: number, max: number, rng: () => number): number {
  const floorMin = Math.ceil(min);
  const floorMax = Math.floor(max);
  if (floorMin > floorMax) return floorMin;
  return Math.floor(rng() * (floorMax - floorMin + 1)) + floorMin;
}

/**
 * Escolhe um elemento aleatório de um array
 */
export function pick<T>(items: readonly T[], rng: () => number): T {
  if (items.length === 0) {
    throw new Error('Não é possível escolher elemento de array vazio');
  }
  const idx = Math.floor(rng() * items.length);
  const item = items[idx];
  if (item === undefined) {
    throw new Error('Erro ao selecionar elemento do array');
  }
  return item;
}

/**
 * Retorna uma nova cópia embaralhada do array usando o algoritmo Fisher-Yates
 */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = copy[i];
    const target = copy[j];
    if (temp !== undefined && target !== undefined) {
      copy[i] = target;
      copy[j] = temp;
    }
  }
  return copy;
}
