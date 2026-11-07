import { z } from 'zod';
import { GameConfigSchema, GameConfigBaseSchema, PlayerRoleSchema } from './engine/types';

// ==========================================
// 1. CONTRATOS DE PERFIL
// ==========================================

export const CreateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(16, 'Nome deve ter no máximo 16 caracteres')
    .regex(/^[\w\sÀ-ÿ-]+$/, 'Nome contém caracteres inválidos'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida em formato hex (#RRGGBB)'),
});
export type CreateProfileRequest = z.infer<typeof CreateProfileSchema>;

export interface CreateProfileResponse {
  profileId: string;
  name: string;
  color: string;
  deviceToken: string;
  recoveryCode: string;
}

export const RecoverProfileSchema = z.object({
  name: z.string().trim().min(2).max(16),
  recoveryCode: z.string().trim().min(8).max(32),
});
export type RecoverProfileRequest = z.infer<typeof RecoverProfileSchema>;

export interface RecoverProfileResponse {
  profileId: string;
  name: string;
  color: string;
  deviceToken: string;
}

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2).max(16).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;

export interface UpdateProfileResponse {
  profileId: string;
  name: string;
  color: string;
}

export interface CheckProfileResponse {
  available: boolean;
}

// ==========================================
// 2. CONTRATOS DE SALAS
// ==========================================

export const CreateRoomSchema = z.object({
  config: GameConfigSchema.optional(),
  password: z.string().max(32).optional(),
  hostProfile: z
    .object({
      name: z.string().trim().min(2).max(16).optional(),
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    })
    .optional(),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomSchema>;

export interface CreateRoomResponse {
  code: string;
  token: string;
  playerId: string;
  roomId: string;
}

export const JoinRoomSchema = z.object({
  password: z.string().max(32).optional(),
  name: z.string().trim().min(2).max(16).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  role: PlayerRoleSchema.optional(),
});
export type JoinRoomRequest = z.infer<typeof JoinRoomSchema>;

export interface JoinRoomResponse {
  code: string;
  token: string;
  playerId: string;
  role: 'player' | 'spectator';
}

// Resposta de estado público (GET /api/rooms/[code]/state)
export type RoomStateResponse =
  | {
      minimal: true;
      roomName: string;
      hasPassword: boolean;
      playerCount: number;
      status: 'lobby' | 'playing' | 'finished';
    }
  | {
      minimal: false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      room: any;
      hasPassword: boolean;
    };

// ==========================================
// 3. CONTRATOS DE AÇÕES DE SALA
// ==========================================

export const GameActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ADD_PLAYER'),
    actorId: z.string(),
    player: z.object({
      id: z.string(),
      name: z.string().min(2).max(16),
      color: z.string(),
      role: PlayerRoleSchema.optional(),
    }),
  }),
  z.object({
    type: z.literal('KICK'),
    actorId: z.string(),
    targetId: z.string(),
  }),
  z.object({
    type: z.literal('LEAVE'),
    actorId: z.string(),
  }),
  z.object({
    type: z.literal('SET_AWAY'),
    actorId: z.string(),
    isAway: z.boolean(),
  }),
  z.object({
    type: z.literal('START'),
    actorId: z.string(),
  }),
  z.object({
    type: z.literal('END_ROUND'),
    actorId: z.string(),
  }),
  z.object({
    type: z.literal('SET_DAMAGE'),
    actorId: z.string(),
    targetId: z.string(),
    damage: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('CONFIRM'),
    actorId: z.string(),
  }),
  z.object({
    type: z.literal('FORCE_CLOSE'),
    actorId: z.string(),
  }),
  z.object({
    type: z.literal('NEXT_ROUND'),
    actorId: z.string(),
  }),
  z.object({
    type: z.literal('PROPOSE_ADJUST'),
    actorId: z.string(),
    targetId: z.string(),
    delta: z.union([z.literal(1), z.literal(-1)]),
  }),
  z.object({
    type: z.literal('VOTE'),
    actorId: z.string(),
    proposalId: z.string(),
    approve: z.boolean(),
  }),
  z.object({
    type: z.literal('HOST_ADJUST'),
    actorId: z.string(),
    targetId: z.string(),
    delta: z.union([z.literal(1), z.literal(-1)]),
  }),
  z.object({
    type: z.literal('TRANSFER_HOST'),
    actorId: z.string(),
    newHostId: z.string(),
  }),
  z.object({
    type: z.literal('UNDO_LAST_ROUND'),
    actorId: z.string(),
  }),
  z.object({
    type: z.literal('REMATCH'),
    actorId: z.string(),
  }),
  z.object({
    type: z.literal('UPDATE_CONFIG'),
    actorId: z.string(),
    config: GameConfigBaseSchema.partial(),
  }),
]);

export const RoomActionRequestSchema = z.object({
  action: GameActionSchema,
});
export type RoomActionRequest = z.infer<typeof RoomActionRequestSchema>;

export interface RoomActionResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  room: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[];
}

// ==========================================
// 4. RESPOSTA DE ERRO PADRONIZADA
// ==========================================

export interface ApiErrorResponse {
  error: string;
  code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION' | 'RULE_VIOLATION' | 'RATE_LIMITED' | 'INTERNAL' | 'not_configured';
  details?: unknown;
}
