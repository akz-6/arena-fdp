import 'server-only';
import { GameState } from '../engine/types';
import { projectPublic } from '../engine/project';
import { getSupabaseAdmin } from './supabase';

/**
 * Publica atualização em tempo real para todos os clientes conectados na sala via Supabase Broadcast.
 * O payload é SEMPRE sanitizado por projectPublic para evitar vazamento de vidas ocultas.
 */
export async function broadcastRoomState(code: string, state: GameState): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // Sem credenciais do Supabase configuradas (ex: modo teste ou local)
    return false;
  }

  try {
    const publicState = projectPublic(state);
    const channelName = `room:${code.toUpperCase()}`;
    const channel = supabase.channel(channelName);

    await channel.send({
      type: 'broadcast',
      event: 'state',
      payload: {
        room: publicState,
        version: state.version,
      },
    });

    // Remove canal da memória do cliente admin para evitar vazamento de conexões
    supabase.removeChannel(channel);
    return true;
  } catch (err) {
    console.error(`Erro ao emitir broadcast na sala ${code}:`, err);
    return false;
  }
}
