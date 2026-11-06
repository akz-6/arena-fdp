import { NextRequest, NextResponse } from 'next/server';
import { RecoverProfileSchema } from '@/lib/contracts';
import { getProfileRepository } from '@/lib/server/profile-repo';
import { signProfileToken } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'local';
  const rl = checkRateLimit(`profile:recover:${ip}`, { windowMs: 60_000, max: 10 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas de recuperação. Aguarde um instante.', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = RecoverProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nome ou código de recuperação com formato inválido', code: 'VALIDATION' },
        { status: 400 }
      );
    }

    const repo = getProfileRepository();
    const newDeviceSecret = crypto.randomUUID();

    const profile = await repo.recoverProfile(
      parsed.data.name,
      parsed.data.recoveryCode,
      newDeviceSecret
    );

    if (!profile) {
      return NextResponse.json(
        { error: 'Nome ou código de recuperação incorreto', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const deviceToken = await signProfileToken({
      profileId: profile.id,
      name: profile.name,
    });

    return NextResponse.json({
      profileId: profile.id,
      name: profile.name,
      color: profile.color,
      deviceToken,
    });
  } catch (err) {
    console.error('Erro em POST /api/profile/recover:', err);
    return NextResponse.json(
      { error: 'Erro interno ao recuperar perfil', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
