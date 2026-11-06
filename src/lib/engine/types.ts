import { z } from 'zod';

// ==========================================
// 1. CONFIGURAÇÃO DO JOGO
// ==========================================

export const GameConfigBaseSchema = z.object({
  roomName: z.string().min(2).max(32).default('Arena FDP'),
  lifeVisibility: z.enum(['visible', 'hidden']).default('visible'),
  lifeMode: z.enum(['fixed', 'random']).default('fixed'),
  lifeFixed: z.number().int().min(1).max(99).default(5),
  lifeMin: z.number().int().min(1).max(99).default(3),
  lifeMax: z.number().int().min(1).max(99).default(7),
  lifeRandomScope: z.enum(['shared', 'individual']).default('individual'),
  hostRole: z.enum(['player', 'spectator']).default('player'),
  showHitCount: z.boolean().default(true),
  expectedPlayers: z.number().int().min(2).max(100).nullable().default(null),
  maxCardsCap: z.number().int().min(1).max(40).nullable().default(null),
  decks: z.union([z.number().int().min(1).max(10), z.literal('auto')]).default('auto'),
  operatorMode: z.boolean().default(false), // true em Singleplayer (organizador controla)
});

export const GameConfigSchema = GameConfigBaseSchema.refine((data) => data.lifeMin <= data.lifeMax, {
  message: 'lifeMin deve ser menor ou igual a lifeMax',
  path: ['lifeMin'],
});

export type GameConfig = z.infer<typeof GameConfigSchema>;

// ==========================================
// 2. JOGADOR
// ==========================================

export const PlayerRoleSchema = z.enum(['player', 'spectator']);
export type PlayerRole = z.infer<typeof PlayerRoleSchema>;

export const PlayerStatusSchema = z.enum(['alive', 'dead', 'away', 'kicked']);
export type PlayerStatus = z.infer<typeof PlayerStatusSchema>;

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(16),
  color: z.string(),
  role: PlayerRoleSchema,
  status: PlayerStatusSchema,
  joinOrder: z.number().int(),
  life: z.number().int().min(0).optional(),
});

export type Player = z.infer<typeof PlayerSchema>;

// ==========================================
// 3. REVELAÇÃO E GOLPES
// ==========================================

export interface RevealHit {
  playerId: string;
  damage: number | null; // null em hidden quando showHitCount = false
  died: boolean;
}

export interface Reveal {
  round: number;
  seed: number;
  hits: RevealHit[];
}

// ==========================================
// 4. CONSENSO / PROPOSTAS
// ==========================================

export interface Proposal {
  id: string;
  proposerId: string;
  targetId: string;
  delta: 1 | -1;
  approvals: string[]; // ids dos jogadores que aprovaram
  status: 'pending' | 'approved' | 'rejected';
}

// ==========================================
// 5. ESTADO DO JOGO
// ==========================================

export type GamePhase = 'lobby' | 'round' | 'reporting' | 'reveal' | 'finished';
export type CardDirection = 'up' | 'down';

export interface GameState {
  version: number;
  phase: GamePhase;
  config: GameConfig;
  players: Player[];
  hostId: string;
  dealerId: string | null;
  roundNumber: number;
  cardsThisRound: number;
  direction: CardDirection;
  pendingDamage: Record<string, number>; // playerId -> dano
  confirmed: string[]; // playerIds que confirmaram reporte
  lastReveal: Reveal | null;
  proposals: Proposal[];
  winners: string[] | null; // 1 vencedor ou lista (empate)
  seed: number;
  prevSnapshot?: Omit<GameState, 'prevSnapshot'> | null; // Para desfazer última rodada
}

// ==========================================
// 6. EVENTOS DO JOGO
// ==========================================

export type GameEvent =
  | { type: 'PLAYER_JOINED'; playerId: string; name: string }
  | { type: 'PLAYER_KICKED'; playerId: string }
  | { type: 'HOST_TRANSFERRED'; fromHostId: string; toHostId: string }
  | { type: 'ROUND_STARTED'; round: number; cards: number; dealerId: string }
  | { type: 'REPORTING_STARTED'; round: number }
  | { type: 'DAMAGE_TAKEN'; playerId: string; damage: number }
  | { type: 'PLAYER_DIED'; playerId: string }
  | { type: 'PROPOSAL_CREATED'; proposal: Proposal }
  | { type: 'PROPOSAL_RESOLVED'; proposalId: string; status: 'approved' | 'rejected' }
  | { type: 'ROUND_REVEALED'; reveal: Reveal }
  | { type: 'GAME_OVER'; winners: string[]; isTie: boolean }
  | { type: 'ROUND_UNDONE'; restoredRound: number };

// ==========================================
// 7. ACTIONS (Ações da Engine)
// ==========================================

export type GameAction =
  | { type: 'ADD_PLAYER'; actorId: string; player: { id: string; name: string; color: string; role?: PlayerRole } }
  | { type: 'KICK'; actorId: string; targetId: string }
  | { type: 'LEAVE'; actorId: string }
  | { type: 'SET_AWAY'; actorId: string; isAway: boolean }
  | { type: 'START'; actorId: string }
  | { type: 'END_ROUND'; actorId: string }
  | { type: 'SET_DAMAGE'; actorId: string; targetId: string; damage: number }
  | { type: 'CONFIRM'; actorId: string }
  | { type: 'FORCE_CLOSE'; actorId: string }
  | { type: 'NEXT_ROUND'; actorId: string }
  | { type: 'PROPOSE_ADJUST'; actorId: string; targetId: string; delta: 1 | -1 }
  | { type: 'VOTE'; actorId: string; proposalId: string; approve: boolean }
  | { type: 'HOST_ADJUST'; actorId: string; targetId: string; delta: 1 | -1 }
  | { type: 'TRANSFER_HOST'; actorId: string; newHostId: string }
  | { type: 'UNDO_LAST_ROUND'; actorId: string }
  | { type: 'REMATCH'; actorId: string }
  | { type: 'UPDATE_CONFIG'; actorId: string; config: Partial<GameConfig> };

// Contexto Puro (injetado, sem Date.now ou Math.random direto)
export interface EngineContext {
  now: number;
  rng: () => number;
}
