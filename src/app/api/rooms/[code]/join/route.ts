import { NextRequest, NextResponse } from 'next/server';
import { JoinRoomSchema } from '@/lib/contracts';
import { reduce } from '@/lib/engine/reducer';
import { generateRandomName, pickAvailableColor } from '@/lib/engine/names';
import { getRoomsRepository } from '@/lib/server/rooms-repo';
import { verifyPassword } from '@/lib/server/hash';
import { signRoomToken } from '@/lib/server/auth';
import { broadcastRoomState } from '@/lib/server/broadcast';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { isValidRoomCode } from '@/lib/server/code';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cleanCode = code.trim().toUpperCase();

  if (!isValidRoomCode(cleanCode)) {
    return NextResponse.json(
      { error: 'Código de sala inválido', code: 'VALIDATION' },
      { status: 400 }
    );
  }

  const ip = req.headers.get('x-forwarded-for') || 'local';
  const repo = getRoomsRepository();
  const roomData = await repo.loadFull(cleanCode);

  if (!roomData) {
    return NextResponse.json(
      { error: 'Sala não encontrada', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const { room } = roomData;

  const body = await req.json().catch(() => ({}));
  const parsed = JoinRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos para entrada na sala', details: parsed.error.format(), code: 'VALIDATION' },
      { status: 400 }
    );
  }

  // Validação de senha
  if (room.passwordHash) {
    const rlPwd = checkRateLimit(`room:join:pwd:${ip}:${cleanCode}`, {
      windowMs: 60_000,
      max: 6,
    });
    if (!rlPwd.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas com senha incorreta. Aguarde 1 minuto.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const suppliedPassword = parsed.data.password || '';
    const isCorrect = await verifyPassword(suppliedPassword, room.passwordHash);
    if (!isCorrect) {
      return NextResponse.json(
        { error: 'Senha incorreta para esta sala', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
  }

  // Retry loop com CAS para concorrência
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await repo.loadFull(cleanCode);
    if (!current) {
      return NextResponse.json(
        { error: 'Sala não encontrada', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { fullState, room: freshRoom } = current;

    // Regra C9: Se a partida já começou, entra automaticamente como espectador
    let role = parsed.data.role || 'player';
    if (fullState.phase !== 'lobby') {
      role = 'spectator';
    }

    const existingNames = fullState.players.map((p) => p.name);
    const existingColors = fullState.players
      .filter((p) => p.status !== 'kicked')
      .map((p) => p.color);

    let playerName = parsed.data.name?.trim() || '';
    if (!playerName || existingNames.some((n) => n.toLowerCase() === playerName.toLowerCase())) {
      playerName = generateRandomName(existingNames, Math.random);
    }

    let playerColor = parsed.data.color || '';
    if (!playerColor || existingColors.includes(playerColor.toLowerCase())) {
      playerColor = pickAvailableColor(existingColors, Math.random);
    }

    const newPlayerId = crypto.randomUUID();

    try {
      const reduced = reduce(
        fullState,
        {
          type: 'ADD_PLAYER',
          actorId: 'system',
          player: {
            id: newPlayerId,
            name: playerName,
            color: playerColor,
            role,
          },
        },
        { now: Date.now(), rng: Math.random }
      );

      const saved = await repo.saveWithCas(
        freshRoom.id,
        fullState.version,
        reduced.state,
        freshRoom.status
      );

      if (saved) {
        await broadcastRoomState(cleanCode, reduced.state);

        const token = await signRoomToken({
          roomId: freshRoom.id,
          playerId: newPlayerId,
          code: cleanCode,
          role,
        });

        return NextResponse.json({
          code: cleanCode,
          token,
          playerId: newPlayerId,
          role,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Regra violada';
      return NextResponse.json(
        { error: message, code: 'RULE_VIOLATION' },
        { status: 422 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Conflito de concorrência ao entrar na sala. Tente novamente.', code: 'CONFLICT' },
    { status: 409 }
  );
}
