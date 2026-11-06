import 'server-only';
import { getSupabaseAdmin } from './supabase';
import { hashSecret, verifySecret } from './hash';

export interface ProfileRecord {
  id: string;
  name: string;
  color: string;
  deviceSecretHash: string;
  recoveryHash: string;
  createdAt: Date;
}

export interface IProfileRepository {
  createProfile(
    name: string,
    color: string,
    deviceSecret: string,
    recoveryCode: string
  ): Promise<{ profile: ProfileRecord; created: boolean }>;

  getByName(name: string): Promise<ProfileRecord | null>;

  getById(id: string): Promise<ProfileRecord | null>;

  recoverProfile(
    name: string,
    recoveryCode: string,
    newDeviceSecret: string
  ): Promise<ProfileRecord | null>;

  updateProfile(
    id: string,
    updates: { name?: string; color?: string }
  ): Promise<{ profile: ProfileRecord; success: boolean; conflict?: boolean }>;

  isNameAvailable(name: string, excludeId?: string): Promise<boolean>;
}

export class MemoryProfileRepository implements IProfileRepository {
  private profiles = new Map<string, ProfileRecord>(); // nameKey -> ProfileRecord

  async isNameAvailable(name: string, excludeId?: string): Promise<boolean> {
    const key = name.trim().toLowerCase();
    const existing = this.profiles.get(key);
    if (!existing) return true;
    return Boolean(excludeId && existing.id === excludeId);
  }

  async createProfile(
    name: string,
    color: string,
    deviceSecret: string,
    recoveryCode: string
  ): Promise<{ profile: ProfileRecord; created: boolean }> {
    const key = name.trim().toLowerCase();
    if (this.profiles.has(key)) {
      return { profile: this.profiles.get(key)!, created: false };
    }

    const record: ProfileRecord = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
      deviceSecretHash: hashSecret(deviceSecret),
      recoveryHash: hashSecret(recoveryCode),
      createdAt: new Date(),
    };

    this.profiles.set(key, record);
    return { profile: record, created: true };
  }

  async getByName(name: string): Promise<ProfileRecord | null> {
    const key = name.trim().toLowerCase();
    return this.profiles.get(key) ?? null;
  }

  async getById(id: string): Promise<ProfileRecord | null> {
    for (const p of this.profiles.values()) {
      if (p.id === id) return p;
    }
    return null;
  }

  async recoverProfile(
    name: string,
    recoveryCode: string,
    newDeviceSecret: string
  ): Promise<ProfileRecord | null> {
    const profile = await this.getByName(name);
    if (!profile) return null;

    const matches = verifySecret(recoveryCode, profile.recoveryHash);
    if (!matches) return null;

    profile.deviceSecretHash = hashSecret(newDeviceSecret);
    return profile;
  }

  async updateProfile(
    id: string,
    updates: { name?: string; color?: string }
  ): Promise<{ profile: ProfileRecord; success: boolean; conflict?: boolean }> {
    const profile = await this.getById(id);
    if (!profile) return { profile: null as unknown as ProfileRecord, success: false };

    if (updates.name && updates.name.trim().toLowerCase() !== profile.name.toLowerCase()) {
      const isFree = await this.isNameAvailable(updates.name, id);
      if (!isFree) {
        return { profile, success: false, conflict: true };
      }
      this.profiles.delete(profile.name.toLowerCase());
      profile.name = updates.name.trim();
      this.profiles.set(profile.name.toLowerCase(), profile);
    }

    if (updates.color) {
      profile.color = updates.color;
    }

    return { profile, success: true };
  }

  clear(): void {
    this.profiles.clear();
  }
}

export class SupabaseProfileRepository implements IProfileRepository {
  async isNameAvailable(name: string, excludeId?: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return true;

    const key = name.trim().toLowerCase();
    let query = supabase.from('profiles').select('id').eq('name_key', key);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { data } = await query.maybeSingle();
    return !data;
  }

  async createProfile(
    name: string,
    color: string,
    deviceSecret: string,
    recoveryCode: string
  ): Promise<{ profile: ProfileRecord; created: boolean }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Supabase client not initialized');

    const deviceSecretHash = hashSecret(deviceSecret);
    const recoveryHash = hashSecret(recoveryCode);

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        name: name.trim(),
        color,
        device_secret_hash: deviceSecretHash,
        recovery_hash: recoveryHash,
      })
      .select()
      .single();

    if (error || !data) {
      // Código 23505 no postgres indica unique violation
      if (error?.code === '23505') {
        const existing = await this.getByName(name);
        return { profile: existing!, created: false };
      }
      throw new Error(`Erro ao criar perfil: ${error?.message}`);
    }

    return {
      profile: {
        id: data.id,
        name: data.name,
        color: data.color,
        deviceSecretHash: data.device_secret_hash,
        recoveryHash: data.recovery_hash,
        createdAt: new Date(data.created_at),
      },
      created: true,
    };
  }

  async getByName(name: string): Promise<ProfileRecord | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const key = name.trim().toLowerCase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('name_key', key)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      deviceSecretHash: data.device_secret_hash,
      recoveryHash: data.recovery_hash,
      createdAt: new Date(data.created_at),
    };
  }

  async getById(id: string): Promise<ProfileRecord | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      deviceSecretHash: data.device_secret_hash,
      recoveryHash: data.recovery_hash,
      createdAt: new Date(data.created_at),
    };
  }

  async recoverProfile(
    name: string,
    recoveryCode: string,
    newDeviceSecret: string
  ): Promise<ProfileRecord | null> {
    const profile = await this.getByName(name);
    if (!profile) return null;

    const matches = verifySecret(recoveryCode, profile.recoveryHash);
    if (!matches) return null;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const newDeviceSecretHash = hashSecret(newDeviceSecret);
    const { data, error } = await supabase
      .from('profiles')
      .update({ device_secret_hash: newDeviceSecretHash })
      .eq('id', profile.id)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      deviceSecretHash: data.device_secret_hash,
      recoveryHash: data.recovery_hash,
      createdAt: new Date(data.created_at),
    };
  }

  async updateProfile(
    id: string,
    updates: { name?: string; color?: string }
  ): Promise<{ profile: ProfileRecord; success: boolean; conflict?: boolean }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Supabase client not initialized');

    const updatePayload: Record<string, string> = {};
    if (updates.name) updatePayload.name = updates.name.trim();
    if (updates.color) updatePayload.color = updates.color;

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        const current = await this.getById(id);
        return { profile: current!, success: false, conflict: true };
      }
      throw new Error(`Erro ao atualizar perfil: ${error?.message}`);
    }

    return {
      profile: {
        id: data.id,
        name: data.name,
        color: data.color,
        deviceSecretHash: data.device_secret_hash,
        recoveryHash: data.recovery_hash,
        createdAt: new Date(data.created_at),
      },
      success: true,
    };
  }
}

const memoryProfiles = new MemoryProfileRepository();
const supabaseProfiles = new SupabaseProfileRepository();

export function getProfileRepository(): IProfileRepository {
  if (process.env.NODE_ENV === 'test' || !getSupabaseAdmin()) {
    return memoryProfiles;
  }
  return supabaseProfiles;
}

export function getMemoryProfileRepository(): MemoryProfileRepository {
  return memoryProfiles;
}
