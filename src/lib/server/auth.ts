import 'server-only';
import { SignJWT, jwtVerify } from 'jose';

const DEFAULT_SECRET = 'arena-fdp-insecure-dev-secret-do-not-use-in-production-32chars';

function getJwtSecret(): Uint8Array {
  const secret = process.env.ROOM_TOKEN_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export interface RoomTokenPayload {
  roomId: string;
  playerId: string;
  code: string;
  role: 'player' | 'spectator';
}

export interface ProfileTokenPayload {
  profileId: string;
  name: string;
}

/**
 * Assina token JWT para jogador ou espectador de sala (validade 24h).
 */
export async function signRoomToken(payload: RoomTokenPayload): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

/**
 * Verifica token JWT de sala. Retorna null se inválido ou expirado.
 */
export async function verifyRoomToken(token: string): Promise<RoomTokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (
      typeof payload.roomId === 'string' &&
      typeof payload.playerId === 'string' &&
      typeof payload.code === 'string' &&
      (payload.role === 'player' || payload.role === 'spectator')
    ) {
      return {
        roomId: payload.roomId,
        playerId: payload.playerId,
        code: payload.code,
        role: payload.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Assina token de dispositivo para perfil global (validade 180 dias).
 */
export async function signProfileToken(payload: ProfileTokenPayload): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('180d')
    .sign(secret);
}

/**
 * Verifica token de dispositivo de perfil global.
 */
export async function verifyProfileToken(token: string): Promise<ProfileTokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (typeof payload.profileId === 'string' && typeof payload.name === 'string') {
      return {
        profileId: payload.profileId,
        name: payload.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extrai Bearer token do header Authorization.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.trim().split(' ');
  if (parts.length === 2 && parts[0]?.toLowerCase() === 'bearer') {
    return parts[1] ?? null;
  }
  return null;
}
