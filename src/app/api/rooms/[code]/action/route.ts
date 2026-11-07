import { NextRequest, NextResponse } from 'next/server';
import { RoomActionRequestSchema } from '@/lib/contracts';
import { reduce } from '@/lib/engine/reducer';
import { projectPublic } from '@/lib/engine/project';
import { getRoomsRepository } from '@/lib/server/rooms-repo';
import { verifyRoomToken, extractBearerToken } from '@/lib/server/auth';
import { broadcastRoomState } from '@/lib/server/broadcast';
import { isValidRoomCode } from '@/lib/server/code';
import { isBackendConfigured, notConfiguredResponse } from '@/lib/server/backend-config';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!isBackendConfigured()) {
    return notConfiguredResponse();
  }
  const { code } = await params;
  const cleanCode = code.trim().toUpperCase();

  if (!isValidRoomCode(cleanCode)) {
    return NextResponse.json(
      { error: 'Código de sala inválido', code: 'VALIDATION' },
      { status: 400 }
    );
  }

  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) {
    return NextResponse.json(
      { error: 'Token de autorização ausente', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const tokenPayload = await verifyRoomToken(token);
  if (!tokenPayload) {
    return NextResponse.json(
      { error: 'Token de autorização inválido ou expirado', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  if (tokenPayload.code.toUpperCase() !== cleanCode) {
    return NextResponse.json(
      { error: 'Este token não pertence a esta sala', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RoomActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ação com formato inválido', details: parsed.error.format(), code: 'VALIDATION' },
      { status: 400 }
    );
  }

  const { action } = parsed.data;

  // Garantia de segurança: ninguém pode agir em nome de outro jogador
  if (action.actorId !== tokenPayload.playerId) {
    return NextResponse.json(
      { error: 'Não é permitido executar ações em nome de outro jogador', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const repo = getRoomsRepository();

  // Retry loop com Compare-And-Swap (até 3 tentativas)
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await repo.loadFull(cleanCode);
    if (!current) {
      return NextResponse.json(
        { error: 'Sala não encontrada', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { fullState, room } = current;

    try {
      const reduced = reduce(
        fullState,
        action,
        { now: Date.now(), rng: Math.random }
      );

      let newStatus: 'lobby' | 'playing' | 'finished' = 'playing';
      if (reduced.state.phase === 'lobby') newStatus = 'lobby';
      else if (reduced.state.phase === 'finished') newStatus = 'finished';

      const saved = await repo.saveWithCas(
        room.id,
        fullState.version,
        reduced.state,
        newStatus
      );

      if (saved) {
        await broadcastRoomState(cleanCode, reduced.state);

        return NextResponse.json({
          room: projectPublic(reduced.state),
          events: reduced.events,
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
    { error: 'Conflito de concorrência ao aplicar ação. Tente novamente.', code: 'CONFLICT' },
    { status: 409 }
  );
}
