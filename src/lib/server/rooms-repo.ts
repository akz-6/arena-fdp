import 'server-only';
import { GameState, GameConfig, Player } from '../engine/types';
import { projectPublic } from '../engine/project';
import { getSupabaseAdmin } from './supabase';

export interface RoomRecord {
  id: string;
  code: string;
  status: 'lobby' | 'playing' | 'finished';
  publicState: GameState;
  version: number;
  passwordHash: string | null;
  secretState: {
    lives?: Record<string, number>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prevSnapshot?: any;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface IRoomsRepository {
  createRoom(
    code: string,
    config: GameConfig,
    hostPlayer: Player,
    passwordHash: string | null
  ): Promise<RoomRecord>;

  getRoomByCode(code: string): Promise<RoomRecord | null>;

  loadFull(code: string): Promise<{ room: RoomRecord; fullState: GameState } | null>;

  saveWithCas(
    roomId: string,
    expectedVersion: number,
    fullState: GameState,
    status: 'lobby' | 'playing' | 'finished'
  ): Promise<boolean>;

  cleanupExpired(): Promise<number>;
}

/**
 * Repositório em memória para Vitest e desenvolvimento offline.
 */
export class MemoryRoomsRepository implements IRoomsRepository {
  private rooms = new Map<string, RoomRecord>();

  async createRoom(
    code: string,
    config: GameConfig,
    hostPlayer: Player,
    passwordHash: string | null
  ): Promise<RoomRecord> {
    await this.cleanupExpired();

    const id = crypto.randomUUID();
    const initialFullState: GameState = {
      version: 0,
      phase: 'lobby',
      config,
      players: [hostPlayer],
      hostId: hostPlayer.id,
      dealerId: null,
      roundNumber: 0,
      cardsThisRound: 1,
      direction: 'up',
      pendingDamage: {},
      confirmed: [],
      lastReveal: null,
      proposals: [],
      winners: null,
      seed: Math.floor(Math.random() * 1_000_000),
    };

    const lives: Record<string, number> = {};
    for (const p of initialFullState.players) {
      if (p.life !== undefined) {
        lives[p.id] = p.life;
      }
    }

    const publicState = projectPublic(initialFullState);

    const record: RoomRecord = {
      id,
      code: code.toUpperCase(),
      status: 'lobby',
      publicState,
      version: 0,
      passwordHash,
      secretState: {
        lives,
        prevSnapshot: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    this.rooms.set(record.code, record);
    return record;
  }

  async getRoomByCode(code: string): Promise<RoomRecord | null> {
    const record = this.rooms.get(code.toUpperCase());
    if (!record) return null;
    if (record.expiresAt.getTime() < Date.now()) {
      this.rooms.delete(code.toUpperCase());
      return null;
    }
    return record;
  }

  async loadFull(code: string): Promise<{ room: RoomRecord; fullState: GameState } | null> {
    const room = await this.getRoomByCode(code);
    if (!room) return null;

    // Reconstrói estado completo recombinando vidas e snapshot
    const fullState: GameState = JSON.parse(JSON.stringify(room.publicState));
    if (room.secretState.lives) {
      for (const p of fullState.players) {
        if (room.secretState.lives[p.id] !== undefined) {
          p.life = room.secretState.lives[p.id];
        }
      }
    }
    if (room.secretState.prevSnapshot) {
      fullState.prevSnapshot = room.secretState.prevSnapshot;
    }

    return { room, fullState };
  }

  async saveWithCas(
    roomId: string,
    expectedVersion: number,
    fullState: GameState,
    status: 'lobby' | 'playing' | 'finished'
  ): Promise<boolean> {
    let targetKey: string | null = null;
    let targetRecord: RoomRecord | null = null;

    for (const [key, r] of this.rooms.entries()) {
      if (r.id === roomId) {
        targetKey = key;
        targetRecord = r;
        break;
      }
    }

    if (!targetRecord || !targetKey) return false;
    if (targetRecord.version !== expectedVersion) return false;

    const lives: Record<string, number> = {};
    for (const p of fullState.players) {
      if (p.life !== undefined) {
        lives[p.id] = p.life;
      }
    }

    const publicState = projectPublic(fullState);
    const newVersion = expectedVersion + 1;
    publicState.version = newVersion;
    fullState.version = newVersion;

    targetRecord.publicState = publicState;
    targetRecord.version = newVersion;
    targetRecord.status = status;
    targetRecord.updatedAt = new Date();
    targetRecord.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    targetRecord.secretState = {
      lives,
      prevSnapshot: fullState.prevSnapshot ?? null,
    };

    return true;
  }

  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let count = 0;
    for (const [k, v] of this.rooms.entries()) {
      if (v.expiresAt.getTime() < now) {
        this.rooms.delete(k);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.rooms.clear();
  }
}

/**
 * Repositório Supabase (Postgres com Row Level Security e RPC Compare-And-Swap).
 */
export class SupabaseRoomsRepository implements IRoomsRepository {
  async createRoom(
    code: string,
    config: GameConfig,
    hostPlayer: Player,
    passwordHash: string | null
  ): Promise<RoomRecord> {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Supabase client not initialized');

    await this.cleanupExpired();

    const initialFullState: GameState = {
      version: 0,
      phase: 'lobby',
      config,
      players: [hostPlayer],
      hostId: hostPlayer.id,
      dealerId: null,
      roundNumber: 0,
      cardsThisRound: 1,
      direction: 'up',
      pendingDamage: {},
      confirmed: [],
      lastReveal: null,
      proposals: [],
      winners: null,
      seed: Math.floor(Math.random() * 1_000_000),
    };

    const lives: Record<string, number> = {};
    for (const p of initialFullState.players) {
      if (p.life !== undefined) {
        lives[p.id] = p.life;
      }
    }

    const publicState = projectPublic(initialFullState);

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code: code.toUpperCase(),
        status: 'lobby',
        public_state: publicState,
        version: 0,
      })
      .select()
      .single();

    if (roomError || !room) {
      throw new Error(`Falha ao criar sala no Supabase: ${roomError?.message}`);
    }

    const secretState = {
      lives,
      prevSnapshot: null,
    };

    const { error: secretError } = await supabase.from('room_secrets').insert({
      room_id: room.id,
      password_hash: passwordHash,
      secret_state: secretState,
    });

    if (secretError) {
      // Reverte criação de sala em caso de falha nos segredos
      await supabase.from('rooms').delete().eq('id', room.id);
      throw new Error(`Falha ao salvar segredos da sala: ${secretError.message}`);
    }

    return {
      id: room.id,
      code: room.code,
      status: room.status,
      publicState: room.public_state,
      version: room.version,
      passwordHash,
      secretState,
      createdAt: new Date(room.created_at),
      updatedAt: new Date(room.updated_at),
      expiresAt: new Date(room.expires_at),
    };
  }

  async getRoomByCode(code: string): Promise<RoomRecord | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data: room, error } = await supabase
      .from('rooms')
      .select('*, room_secrets(*)')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !room) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secrets = Array.isArray(room.room_secrets) ? room.room_secrets[0] : (room.room_secrets as any);

    return {
      id: room.id,
      code: room.code,
      status: room.status,
      publicState: room.public_state,
      version: room.version,
      passwordHash: secrets?.password_hash ?? null,
      secretState: secrets?.secret_state ?? {},
      createdAt: new Date(room.created_at),
      updatedAt: new Date(room.updated_at),
      expiresAt: new Date(room.expires_at),
    };
  }

  async loadFull(code: string): Promise<{ room: RoomRecord; fullState: GameState } | null> {
    const room = await this.getRoomByCode(code);
    if (!room) return null;

    const fullState: GameState = JSON.parse(JSON.stringify(room.publicState));
    if (room.secretState.lives) {
      for (const p of fullState.players) {
        if (room.secretState.lives[p.id] !== undefined) {
          p.life = room.secretState.lives[p.id];
        }
      }
    }
    if (room.secretState.prevSnapshot) {
      fullState.prevSnapshot = room.secretState.prevSnapshot;
    }

    return { room, fullState };
  }

  async saveWithCas(
    roomId: string,
    expectedVersion: number,
    fullState: GameState,
    status: 'lobby' | 'playing' | 'finished'
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const lives: Record<string, number> = {};
    for (const p of fullState.players) {
      if (p.life !== undefined) {
        lives[p.id] = p.life;
      }
    }

    const publicState = projectPublic(fullState);
    const newVersion = expectedVersion + 1;
    publicState.version = newVersion;
    fullState.version = newVersion;

    const secretState = {
      lives,
      prevSnapshot: fullState.prevSnapshot ?? null,
    };

    const { data: success, error } = await supabase.rpc('cas_update_room', {
      p_room_id: roomId,
      p_expected_version: expectedVersion,
      p_public_state: publicState,
      p_status: status,
      p_secret_state: secretState,
    });

    if (error) {
      console.error('Erro na RPC cas_update_room:', error);
      return false;
    }

    return Boolean(success);
  }

  async cleanupExpired(): Promise<number> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return 0;

    const { data, error } = await supabase
      .from('rooms')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error || !data) return 0;
    return data.length;
  }
}

// Repositório singleton compartilhado
const memoryInstance = new MemoryRoomsRepository();
const supabaseInstance = new SupabaseRoomsRepository();

export function getRoomsRepository(): IRoomsRepository {
  if (process.env.NODE_ENV === 'test' || !getSupabaseAdmin()) {
    return memoryInstance;
  }
  return supabaseInstance;
}

export function getMemoryRoomsRepository(): MemoryRoomsRepository {
  return memoryInstance;
}
