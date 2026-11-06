import { pick } from './rng';

export const TOON_NOUNS = [
  'Pato',
  'Tomate',
  'Gato',
  'Cachorro',
  'Pinguim',
  'Coelho',
  'Dinossauro',
  'Panda',
  'Robô',
  'Polvo',
  'Tubarão',
  'Gambá',
  'Corvo',
  'Tigre',
  'Gorila',
  'Morcego',
  'Crocodilo',
  'Capivara',
  'Papagaio',
  'Esquilo',
] as const;

export const TOON_ADJECTIVES = [
  'Maluco',
  'Bravo',
  'Ninja',
  'Veloz',
  'Furioso',
  'Elétrico',
  'Mágico',
  'Esperto',
  'Pirata',
  'Radical',
  'Astronauta',
  'Cósmico',
  'Dorminhoco',
  'Valente',
  'Tagarela',
  'Trapalhão',
  'Saltitante',
  'Gigante',
  'Espacial',
  'Atômico',
] as const;

export const ROOM_PALETTE = [
  '#FF3038', // Vermelho
  '#FF9500', // Laranja
  '#FFC233', // Amarelo
  '#2ECC71', // Verde
  '#00C2A8', // Turquesa
  '#35B8F4', // Azul
  '#5B6CFF', // Índigo
  '#8E5CF7', // Roxo
  '#FF4FA3', // Rosa
  '#8B5E3C', // Marrom
  '#6B7280', // Cinza
  '#111111', // Preto
] as const;

/**
 * Gera um nome aleatório cartoon único em relação aos nomes ocupados.
 */
export function generateRandomName(
  occupiedNames: readonly string[],
  rng: () => number
): string {
  const normalized = new Set(occupiedNames.map((n) => n.trim().toLowerCase()));

  // Tenta até 100 combinações simples que respeitem o limite de 16 caracteres
  for (let attempt = 0; attempt < 100; attempt++) {
    const noun = pick(TOON_NOUNS, rng);
    const adj = pick(TOON_ADJECTIVES, rng);
    const candidate = `${noun} ${adj}`;
    if (candidate.length <= 16 && !normalized.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // Se houver colisões ou combinações longas, tenta com sufixo numérico
  for (let attempt = 1; attempt <= 1000; attempt++) {
    const noun = pick(TOON_NOUNS, rng);
    const candidate = `${noun} ${attempt}`;
    if (candidate.length <= 16 && !normalized.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  const fallback = `Jogador ${Math.floor(rng() * 999)}`.slice(0, 16);
  return fallback;
}

/**
 * Escolhe uma cor livre aleatória da paleta que não esteja ocupada na sala.
 */
export function pickAvailableColor(
  occupiedColors: readonly string[],
  rng: () => number
): string {
  const occupiedSet = new Set(occupiedColors.map((c) => c.toLowerCase()));
  const available = ROOM_PALETTE.filter((c) => !occupiedSet.has(c.toLowerCase()));

  if (available.length > 0) {
    return pick(available, rng);
  }

  // Fallback se todas as 12 cores estiverem ocupadas (sala com mais de 12 jogadores)
  return pick(ROOM_PALETTE, rng);
}
