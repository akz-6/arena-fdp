import { createClient, SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/**
 * Cliente Supabase de navegador usando apenas a Anon Key pública.
 * Utilizado unicamente para escutar canais de Broadcast de salas.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return browserClient;
}
