import { NextRequest, NextResponse } from 'next/server';
import { CreateRoomSchema } from '@/lib/contracts';
import { GameConfigSchema, Player } from '@/lib/engine/types';
import { generateRandomName, pickAvailableColor } from '@/lib/engine/names';
import { getRoomsRepository } from '@/lib/server/rooms-repo';
import { generateRoomCode } from '@/lib/server/code';
import { hashPassword } from '@/lib/server/hash';
import { signRoomToken } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { isBackendConfigured, notConfiguredResponse, BackendNotConfiguredError } from '@/lib/server/backend-config';

export async function POST(req: NextRequest) {
  if (!isBackendConfigured()) {
    return notConfiguredResponse();
  }
  const ip = req.headers.get('x-forwarded-for') || 'local';
  const rl = checkRateLimit(`rooms:create:${ip}`, { windowMs: 60_000, max: 20 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas criações de sala. Aguarde um instante.', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = CreateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos para criação da sala', details: parsed.error.format(), code: 'VALIDATION' },
        { status: 400 }
      );
    }

    const { config: customConfig, password, hostProfile } = parsed.data;
    const config = GameConfigSchema.parse(customConfig ?? {});

    const repo = getRoomsRepository();

    // Gera código único sem colisão
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 5 && (await repo.getRoomByCode(code))) {
      code = generateRoomCode();
      attempts++;
    }

    const passwordHash = password ? await hashPassword(password) : null;

    // Configuração do jogador Host
    const hostId = crypto.randomUUID();
    const hostRole = config.hostRole;
    const hostName =
      hostProfile?.name?.trim() ||
      generateRandomName([], Math.random);
    const hostColor =
      hostProfile?.color ||
      pickAvailableColor([], Math.random);

    const hostPlayer: Player = {
      id: hostId,
      name: hostName,
      color: hostColor,
      role: hostRole,
      status: 'alive',
      joinOrder: 1,
    };

    const room = await repo.createRoom(code, config, hostPlayer, passwordHash);

    const token = await signRoomToken({
      roomId: room.id,
      playerId: hostPlayer.id,
      code: room.code,
      role: hostPlayer.role,
    });

    return NextResponse.json(
      {
        code: room.code,
        token,
        playerId: hostPlayer.id,
        roomId: room.id,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof BackendNotConfiguredError) {
      return notConfiguredResponse();
    }
    console.error('Erro em POST /api/rooms:', err);
    return NextResponse.json(
      { error: 'Erro interno ao criar sala', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
