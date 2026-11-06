import { NextRequest, NextResponse } from 'next/server';
import { CreateProfileSchema, UpdateProfileSchema } from '@/lib/contracts';
import { getProfileRepository } from '@/lib/server/profile-repo';
import { generateRecoveryCode } from '@/lib/server/hash';
import { signProfileToken, verifyProfileToken, extractBearerToken } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'local';
  const rl = checkRateLimit(`profile:post:${ip}`, { windowMs: 60_000, max: 15 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns segundos.', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = CreateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos para criação de perfil', details: parsed.error.format(), code: 'VALIDATION' },
        { status: 400 }
      );
    }

    const repo = getProfileRepository();
    const isAvailable = await repo.isNameAvailable(parsed.data.name);
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Este nome já está em uso na Arena FDP', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    const deviceSecret = crypto.randomUUID();
    const recoveryCode = generateRecoveryCode();

    const { profile, created } = await repo.createProfile(
      parsed.data.name,
      parsed.data.color,
      deviceSecret,
      recoveryCode
    );

    if (!created) {
      return NextResponse.json(
        { error: 'Este nome já está em uso na Arena FDP', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    const deviceToken = await signProfileToken({
      profileId: profile.id,
      name: profile.name,
    });

    return NextResponse.json(
      {
        profileId: profile.id,
        name: profile.name,
        color: profile.color,
        deviceToken,
        recoveryCode,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Erro em POST /api/profile:', err);
    return NextResponse.json(
      { error: 'Erro interno ao processar o perfil', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) {
    return NextResponse.json(
      { error: 'Token de perfil ausente', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const payload = await verifyProfileToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Token de perfil inválido ou expirado', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos para atualização', details: parsed.error.format(), code: 'VALIDATION' },
        { status: 400 }
      );
    }

    const repo = getProfileRepository();
    const result = await repo.updateProfile(payload.profileId, parsed.data);

    if (result.conflict) {
      return NextResponse.json(
        { error: 'Este nome já está em uso por outro guerreiro', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Perfil não encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profileId: result.profile.id,
      name: result.profile.name,
      color: result.profile.color,
    });
  } catch (err) {
    console.error('Erro em PATCH /api/profile:', err);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar perfil', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
