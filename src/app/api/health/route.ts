import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { isTokenSecretOk } from '@/lib/server/auth';
import packageJson from '../../../../package.json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseConfigured = Boolean(supabaseUrl && serviceKey);
  const realtimeConfigured = Boolean(supabaseUrl && anonKey);
  const tokenSecretOk = isTokenSecretOk();

  let schemaOk = false;

  if (supabaseConfigured) {
    try {
      const admin = getSupabaseAdmin();
      if (admin) {
        // Consultas leves confirmando que as tabelas profiles, rooms, room_secrets e a função cas_update_room existem
        const [pRes, rRes, sRes, rpcRes] = await Promise.all([
          admin.from('profiles').select('id').limit(1),
          admin.from('rooms').select('id').limit(1),
          admin.from('room_secrets').select('room_id').limit(1),
          admin.rpc('cas_update_room', {
            p_room_id: '00000000-0000-0000-0000-000000000000',
            p_expected_version: 0,
            p_public_state: {},
            p_status: 'lobby',
            p_secret_state: {},
          }),
        ]);

        const tablesOk = !pRes.error && !rRes.error && !sRes.error;
        const fnOk = !rpcRes.error || rpcRes.error.code !== '42883';

        schemaOk = Boolean(tablesOk && fnOk);
      }
    } catch {
      schemaOk = false;
    }
  }

  return NextResponse.json({
    version: packageJson.version,
    supabaseConfigured,
    realtimeConfigured,
    tokenSecretOk,
    schemaOk,
  });
}
