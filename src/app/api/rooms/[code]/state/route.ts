import { NextRequest, NextResponse } from 'next/server';
import { getRoomsRepository } from '@/lib/server/rooms-repo';
import { verifyRoomToken, extractBearerToken } from '@/lib/server/auth';
import { isValidRoomCode } from '@/lib/server/code';

export async function GET(
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

  const repo = getRoomsRepository();
  const room = await repo.getRoomByCode(cleanCode);

  if (!room) {
    return NextResponse.json(
      { error: 'Sala não encontrada', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const token = extractBearerToken(req.headers.get('authorization'));
  let isAuthorized = false;

  if (token) {
    const payload = await verifyRoomToken(token);
    if (payload && payload.code.toUpperCase() === cleanCode) {
      isAuthorized = true;
    }
  }

  // Se não autenticado pelo token de membro da sala, retorna dados mínimos para a tela de entrada/senha
  if (!isAuthorized) {
    return NextResponse.json({
      minimal: true,
      roomName: room.publicState.config.roomName,
      hasPassword: Boolean(room.passwordHash),
      playerCount: room.publicState.players.filter((p) => p.status !== 'kicked').length,
      status: room.status,
    });
  }

  return NextResponse.json({
    minimal: false,
    room: room.publicState,
    hasPassword: Boolean(room.passwordHash),
  });
}
