/**
 * Hierarquia oficial de cartas do jogo FDP (baseada no truco com manilhas fixas)
 * Conforme 03-REGRAS-DO-JOGO.md e planta do sistema.
 */

export const TIE_SEVEN_CLUBS_SPADES = true;

export interface CardTier {
  position: number; // 0 é o mais fraco, 13 é o mais forte (Zap)
  name: string;
  cards: string[];
  nickname?: string;
  description: string;
}

export const CARD_TIERS: CardTier[] = [
  {
    position: 0,
    name: 'Quatros Comuns',
    cards: ['4♥ Copas', '4♠ Espadas', '4♦ Ouros'],
    description: 'As cartas mais fracas do baralho.',
  },
  {
    position: 1,
    name: 'Cincos',
    cards: ['5♥', '5♠', '5♦', '5♣'],
    description: 'Todos os naipes empatados.',
  },
  {
    position: 2,
    name: 'Seis',
    cards: ['6♥', '6♠', '6♦', '6♣'],
    description: 'Todos os naipes empatados.',
  },
  {
    position: 3,
    name: 'Setes Comuns',
    cards: ['7♣ Paus', '7♠ Espadas'],
    description: 'Sete de Paus e Sete de Espadas empatados na regra padrão.',
  },
  {
    position: 4,
    name: 'Damas (Q)',
    cards: ['Q♥', 'Q♠', 'Q♦', 'Q♣'],
    description: 'Todas as damas empatadas.',
  },
  {
    position: 5,
    name: 'Valetes (J)',
    cards: ['J♥', 'J♠', 'J♦', 'J♣'],
    description: 'Todos os valetes empatados.',
  },
  {
    position: 6,
    name: 'Reis (K)',
    cards: ['K♥', 'K♠', 'K♦', 'K♣'],
    description: 'Todos os reis empatados.',
  },
  {
    position: 7,
    name: 'Ases Comuns',
    cards: ['A♥ Copas', 'A♦ Ouros', 'A♣ Paus'],
    description: 'Todos os ases exceto o Ás de Espadas.',
  },
  {
    position: 8,
    name: 'Dois',
    cards: ['2♥', '2♠', '2♦', '2♣'],
    description: 'Todos os dois empatados.',
  },
  {
    position: 9,
    name: 'Três',
    cards: ['3♥', '3♠', '3♦', '3♣'],
    description: 'A carta normal mais forte.',
  },
  {
    position: 10,
    name: 'Sete de Ouros',
    cards: ['7♦ Ouros'],
    nickname: 'Pica-fumo',
    description: '4ª maior manilha.',
  },
  {
    position: 11,
    name: 'Ás de Espadas',
    cards: ['A♠ Espadas'],
    nickname: 'Espadilha',
    description: '3ª maior manilha.',
  },
  {
    position: 12,
    name: 'Sete de Copas',
    cards: ['7♥ Copas'],
    nickname: 'Escopeta / Copeta',
    description: '2ª maior manilha.',
  },
  {
    position: 13,
    name: 'Quatro de Paus',
    cards: ['4♣ Paus'],
    nickname: 'Zap',
    description: 'A carta mais poderosa e temida do jogo!',
  },
];
