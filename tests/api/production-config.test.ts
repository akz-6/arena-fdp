import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  isBackendConfigured,
  BackendNotConfiguredError,
} from '@/lib/server/backend-config';
import { getRoomsRepository } from '@/lib/server/rooms-repo';
import { getProfileRepository } from '@/lib/server/profile-repo';
import {
  isTokenSecretOk,
  assertTokenSecretValid,
  signRoomToken,
} from '@/lib/server/auth';
import { POST as createRoomPost } from '@/app/api/rooms/route';
import { GET as getRoomState } from '@/app/api/rooms/[code]/state/route';
import { POST as joinRoomPost } from '@/app/api/rooms/[code]/join/route';
import { POST as roomActionPost } from '@/app/api/rooms/[code]/action/route';
import { POST as createProfilePost } from '@/app/api/profile/route';
import { GET as checkProfileGet } from '@/app/api/profile/check/route';
import { POST as recoverProfilePost } from '@/app/api/profile/recover/route';
import { GET as healthGet } from '@/app/api/health/route';

describe('P0.1 - Produção Segura sem Backend Configurado', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Limpa variáveis de ambiente relevantes
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.ROOM_TOKEN_SECRET;
    delete process.env.FDP_ALLOW_MEMORY_REPO;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('bloqueia repositórios em memória em NODE_ENV=production sem FDP_ALLOW_MEMORY_REPO=1', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    expect(isBackendConfigured()).toBe(false);
    expect(() => getRoomsRepository()).toThrowError(BackendNotConfiguredError);
    expect(() => getProfileRepository()).toThrowError(BackendNotConfiguredError);
  });

  it('permite repositório em memória quando FDP_ALLOW_MEMORY_REPO=1', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    process.env.FDP_ALLOW_MEMORY_REPO = '1';

    expect(isBackendConfigured()).toBe(true);
    expect(() => getRoomsRepository()).not.toThrow();
    expect(() => getProfileRepository()).not.toThrow();
  });

  it('recusa segredo de token ausente, padrão ou curto em produção', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.FDP_ALLOW_MEMORY_REPO;

    // Sem variável
    delete process.env.ROOM_TOKEN_SECRET;
    expect(isTokenSecretOk()).toBe(false);
    expect(() => assertTokenSecretValid()).toThrow();

    // Segredo de desenvolvimento padrão
    process.env.ROOM_TOKEN_SECRET = 'arena-fdp-insecure-dev-secret-do-not-use-in-production-32chars';
    expect(isTokenSecretOk()).toBe(false);
    expect(() => assertTokenSecretValid()).toThrow();

    // Menos de 32 caracteres
    process.env.ROOM_TOKEN_SECRET = 'curto_demais';
    expect(isTokenSecretOk()).toBe(false);
    expect(() => assertTokenSecretValid()).toThrow();

    // Válido (32+ caracteres e não é o padrão de dev)
    process.env.ROOM_TOKEN_SECRET = 'este-segredo-possui-mais-de-trinta-e-dois-caracteres-validos-123456';
    expect(isTokenSecretOk()).toBe(true);
    expect(() => assertTokenSecretValid()).not.toThrow();
  });

  it('todas as rotas /api/rooms* e /api/profile* respondem 503 { error: "not_configured" } sem Supabase em produção', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.FDP_ALLOW_MEMORY_REPO;

    // POST /api/rooms
    const reqCreateRoom = new NextRequest('http://localhost/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ config: { roomName: 'Teste' } }),
    });
    const resCreateRoom = await createRoomPost(reqCreateRoom);
    expect(resCreateRoom.status).toBe(503);
    const bodyCreateRoom = await resCreateRoom.json();
    expect(bodyCreateRoom).toEqual({ error: 'not_configured' });

    // GET /api/rooms/TEST01/state
    const reqGetState = new NextRequest('http://localhost/api/rooms/TEST01/state');
    const resGetState = await getRoomState(reqGetState, {
      params: Promise.resolve({ code: 'TEST01' }),
    });
    expect(resGetState.status).toBe(503);
    expect(await resGetState.json()).toEqual({ error: 'not_configured' });

    // POST /api/rooms/TEST01/join
    const reqJoin = new NextRequest('http://localhost/api/rooms/TEST01/join', {
      method: 'POST',
      body: JSON.stringify({ name: 'Jogador 1' }),
    });
    const resJoin = await joinRoomPost(reqJoin, {
      params: Promise.resolve({ code: 'TEST01' }),
    });
    expect(resJoin.status).toBe(503);
    expect(await resJoin.json()).toEqual({ error: 'not_configured' });

    // POST /api/rooms/TEST01/action
    const reqAction = new NextRequest('http://localhost/api/rooms/TEST01/action', {
      method: 'POST',
      headers: { authorization: 'Bearer token-falso' },
      body: JSON.stringify({ expectedVersion: 1, action: { type: 'START', actorId: 'id1' } }),
    });
    const resAction = await roomActionPost(reqAction, {
      params: Promise.resolve({ code: 'TEST01' }),
    });
    expect(resAction.status).toBe(503);
    expect(await resAction.json()).toEqual({ error: 'not_configured' });

    // POST /api/profile
    const reqProfile = new NextRequest('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({ name: 'Novo Perfil', color: '#FF3038' }),
    });
    const resProfile = await createProfilePost(reqProfile);
    expect(resProfile.status).toBe(503);
    expect(await resProfile.json()).toEqual({ error: 'not_configured' });

    // GET /api/profile/check
    const reqProfileCheck = new NextRequest('http://localhost/api/profile/check?name=Teste');
    const resProfileCheck = await checkProfileGet(reqProfileCheck);
    expect(resProfileCheck.status).toBe(503);
    expect(await resProfileCheck.json()).toEqual({ error: 'not_configured' });

    // POST /api/profile/recover
    const reqProfileRecover = new NextRequest('http://localhost/api/profile/recover', {
      method: 'POST',
      body: JSON.stringify({ name: 'Perfil', recoveryCode: 'REC-1234-5678' }),
    });
    const resProfileRecover = await recoverProfilePost(reqProfileRecover);
    expect(resProfileRecover.status).toBe(503);
    expect(await resProfileRecover.json()).toEqual({ error: 'not_configured' });
  });

  it('P0.2: GET /api/health retorna estritamente booleanos e versão, sem vazar segredos', async () => {
    const res = await healthGet();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(typeof body.version).toBe('string');
    expect(typeof body.supabaseConfigured).toBe('boolean');
    expect(typeof body.realtimeConfigured).toBe('boolean');
    expect(typeof body.tokenSecretOk).toBe('boolean');
    expect(typeof body.schemaOk).toBe('boolean');

    // Chaves exatas permitidas
    expect(Object.keys(body).sort()).toEqual([
      'realtimeConfigured',
      'schemaOk',
      'supabaseConfigured',
      'tokenSecretOk',
      'version',
    ]);
  });
});
