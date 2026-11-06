// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, generateRecoveryCode, hashSecret, verifySecret } from '../hash';
import { generateRoomCode, isValidRoomCode } from '../code';
import { signRoomToken, verifyRoomToken, signProfileToken, verifyProfileToken, extractBearerToken } from '../auth';
import { checkRateLimit } from '../rate-limit';
import { MemoryRoomsRepository } from '../rooms-repo';
import { POST as profilePost, PATCH as profilePatch } from '@/app/api/profile/route';
import { POST as recoverPost } from '@/app/api/profile/recover/route';
import { GET as checkGet } from '@/app/api/profile/check/route';
import { POST as roomsPost } from '@/app/api/rooms/route';
import { POST as joinPost } from '@/app/api/rooms/[code]/join/route';
import { GET as stateGet } from '@/app/api/rooms/[code]/state/route';
import { POST as actionPost } from '@/app/api/rooms/[code]/action/route';
import { NextRequest } from 'next/server';

describe('1. Criptografia e Hashing (hash.ts)', () => {
  it('gera hash scrypt e verifica com senha correta e incorreta', async () => {
    const password = 'senha-secreta-fdp-123';
    const hash = await hashPassword(password);

    expect(hash).toContain('$');
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('senha-errada', hash);
    expect(isInvalid).toBe(false);
  });

  it('gera código de recuperação no formato XXXX-XXXX sem caracteres confusos', () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
    expect(code).not.toContain('0');
    expect(code).not.toContain('1');
    expect(code).not.toContain('I');
    expect(code).not.toContain('O');
  });

  it('faz hash SHA-256 e verificação em tempo constante', () => {
    const secret = 'segredo-dispositivo-xyz';
    const hash = hashSecret(secret);
    expect(verifySecret(secret, hash)).toBe(true);
    expect(verifySecret('outro-segredo', hash)).toBe(false);
  });
});

describe('2. Códigos de Sala (code.ts)', () => {
  it('gera código de 6 caracteres válidos sem I, O, 0, 1', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code.length).toBe(6);
      expect(isValidRoomCode(code)).toBe(true);
      expect(code).not.toMatch(/[01IO]/);
    }
  });

  it('valida códigos corretos e rejeita inválidos', () => {
    expect(isValidRoomCode('AB23CD')).toBe(true);
    expect(isValidRoomCode('123456')).toBe(false); // contém 1
    expect(isValidRoomCode('ABCD0E')).toBe(false); // contém 0
    expect(isValidRoomCode('ABC')).toBe(false); // tamanho menor
    expect(isValidRoomCode('')).toBe(false);
  });
});

describe('3. Autenticação e Tokens JWT (auth.ts)', () => {
  it('assina e verifica token de sala com payload completo', async () => {
    const payload = {
      roomId: 'room-123',
      playerId: 'player-456',
      code: 'ABCDEF',
      role: 'player' as const,
    };

    const token = await signRoomToken(payload);
    expect(typeof token).toBe('string');

    const verified = await verifyRoomToken(token);
    expect(verified).toEqual(payload);
  });

  it('rejeita tokens adulterados ou inválidos', async () => {
    const verified = await verifyRoomToken('token.invalido.completamente');
    expect(verified).toBe(null);
  });

  it('assina e verifica token de perfil global', async () => {
    const payload = {
      profileId: 'prof-789',
      name: 'Pato Maluco',
    };

    const token = await signProfileToken(payload);
    const verified = await verifyProfileToken(token);
    expect(verified).toEqual(payload);
  });

  it('extrai Bearer token corretamente do cabeçalho Authorization', () => {
    expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(extractBearerToken('bearer xyz123')).toBe('xyz123');
    expect(extractBearerToken('Basic abc')).toBe(null);
    expect(extractBearerToken(null)).toBe(null);
  });
});

describe('4. Rate Limiter em Memória (rate-limit.ts)', () => {
  it('permite requisições dentro do limite e bloqueia excesso', () => {
    const key = `test-ip-${Date.now()}`;
    const opts = { windowMs: 10_000, max: 3 };

    expect(checkRateLimit(key, opts).success).toBe(true);
    expect(checkRateLimit(key, opts).success).toBe(true);
    expect(checkRateLimit(key, opts).success).toBe(true);

    const blocked = checkRateLimit(key, opts);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});

describe('5. Concorrência Compare-And-Swap (rooms-repo.ts)', () => {
  let repo: MemoryRoomsRepository;

  beforeEach(() => {
    repo = new MemoryRoomsRepository();
  });

  it('permite apenas uma atualização concorrente na mesma versão e preserva integridade', async () => {
    const room = await repo.createRoom(
      'CAS123',
      {
        roomName: 'Arena CAS',
        lifeVisibility: 'visible',
        lifeMode: 'fixed',
        lifeFixed: 5,
        lifeMin: 3,
        lifeMax: 7,
        lifeRandomScope: 'individual',
        hostRole: 'player',
        showHitCount: true,
        expectedPlayers: null,
        maxCardsCap: null,
        decks: 'auto',
        operatorMode: false,
      },
      {
        id: 'host-1',
        name: 'Host Original',
        color: '#FF3038',
        role: 'player',
        status: 'alive',
        joinOrder: 1,
        life: 5,
      },
      null
    );

    const full1 = (await repo.loadFull('CAS123'))!;
    const full2 = (await repo.loadFull('CAS123'))!;

    expect(full1.fullState.version).toBe(0);
    expect(full2.fullState.version).toBe(0);

    // Tentativa 1 com versão 0 -> deve passar
    const success1 = await repo.saveWithCas(room.id, 0, full1.fullState, 'playing');
    expect(success1).toBe(true);

    // Tentativa 2 concorrente com a mesma versão 0 -> DEVE FALHAR (evita race condition)
    const success2 = await repo.saveWithCas(room.id, 0, full2.fullState, 'playing');
    expect(success2).toBe(false);

    // Ao recarregar e usar a nova versão 1 -> passa
    const reloaded = (await repo.loadFull('CAS123'))!;
    expect(reloaded.fullState.version).toBe(1);

    const success3 = await repo.saveWithCas(room.id, 1, reloaded.fullState, 'playing');
    expect(success3).toBe(true);
  });
});

describe('6. Rotas de Perfil (API)', () => {
  beforeEach(() => {
    // Limpa estado para testes
  });

  it('cria perfil, impede nome duplicado (case-insensitive) e permite recuperação', async () => {
    // 1. Criar perfil
    const createReq = new NextRequest('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({ name: 'Capivara Ninja', color: '#2ECC71' }),
    });
    const createRes = await profilePost(createReq);
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.name).toBe('Capivara Ninja');
    expect(createData.recoveryCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(createData.deviceToken).toBeDefined();

    // 2. Tentar criar com mesmo nome (case-insensitive) -> 409
    const dupReq = new NextRequest('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({ name: 'capivara ninja', color: '#35B8F4' }),
    });
    const dupRes = await profilePost(dupReq);
    expect(dupRes.status).toBe(409);

    // 3. Checar disponibilidade
    const checkTaken = await checkGet(new NextRequest('http://localhost/api/profile/check?name=Capivara%20Ninja'));
    expect((await checkTaken.json()).available).toBe(false);

    const checkFree = await checkGet(new NextRequest('http://localhost/api/profile/check?name=Tigre%20Novo'));
    expect((await checkFree.json()).available).toBe(true);

    // 4. Recuperar perfil com código
    const recoverReq = new NextRequest('http://localhost/api/profile/recover', {
      method: 'POST',
      body: JSON.stringify({ name: 'Capivara Ninja', recoveryCode: createData.recoveryCode }),
    });
    const recoverRes = await recoverPost(recoverReq);
    expect(recoverRes.status).toBe(200);
    const recoverData = await recoverRes.json();
    expect(recoverData.deviceToken).toBeDefined();

    // 5. Atualizar perfil com token de autorização
    const patchReq = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { authorization: `Bearer ${recoverData.deviceToken}` },
      body: JSON.stringify({ color: '#FFC233' }),
    });
    const patchRes = await profilePatch(patchReq);
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.color).toBe('#FFC233');
  });
});

describe('7. Ciclo Completo de Sala Online e Segurança (API)', () => {
  it('cria sala, entra jogador, valida senha, inicia partida e avança rodada', async () => {
    // 1. Criar sala com senha
    const createReq = new NextRequest('http://localhost/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        password: 'senha-da-arena',
        hostProfile: { name: 'Host Campeão', color: '#FF3038' },
        config: {
          roomName: 'Torneio Secreto',
          lifeVisibility: 'visible',
          lifeFixed: 3,
        },
      }),
    });
    const createRes = await roomsPost(createReq);
    expect(createRes.status).toBe(201);
    const { code, token: hostToken, playerId: hostId } = await createRes.json();
    expect(code).toBeDefined();

    // 2. Consulta de estado sem token -> retorna dados mínimos
    const stateAnonReq = new NextRequest(`http://localhost/api/rooms/${code}/state`);
    const stateAnonRes = await stateGet(stateAnonReq, { params: Promise.resolve({ code }) });
    expect(stateAnonRes.status).toBe(200);
    const anonData = await stateAnonRes.json();
    expect(anonData.minimal).toBe(true);
    expect(anonData.hasPassword).toBe(true);
    expect(anonData.playerCount).toBe(1);

    // 3. Tentar entrar com senha errada -> 401
    const joinWrongReq = new NextRequest(`http://localhost/api/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ password: 'senha-incorreta', name: 'Desafiante' }),
    });
    const joinWrongRes = await joinPost(joinWrongReq, { params: Promise.resolve({ code }) });
    expect(joinWrongRes.status).toBe(401);

    // 4. Entrar com senha correta -> 200 e gera token de jogador
    const joinReq = new NextRequest(`http://localhost/api/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ password: 'senha-da-arena', name: 'Desafiante', color: '#35B8F4' }),
    });
    const joinRes = await joinPost(joinReq, { params: Promise.resolve({ code }) });
    expect(joinRes.status).toBe(200);
    const { token: playerToken, playerId: p2Id } = await joinRes.json();
    expect(playerToken).toBeDefined();

    // 5. Consulta de estado com token de jogador -> retorna estado completo público
    const stateAuthReq = new NextRequest(`http://localhost/api/rooms/${code}/state`, {
      headers: { authorization: `Bearer ${playerToken}` },
    });
    const stateAuthRes = await stateGet(stateAuthReq, { params: Promise.resolve({ code }) });
    const authData = await stateAuthRes.json();
    expect(authData.minimal).toBe(false);
    expect(authData.room.players.length).toBe(2);

    // 6. Não-host tenta dar START -> 422 (regra violada: só host pode iniciar)
    const illegalStartReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${playerToken}` },
      body: JSON.stringify({
        action: { type: 'START', actorId: p2Id },
      }),
    });
    const illegalRes = await actionPost(illegalStartReq, { params: Promise.resolve({ code }) });
    expect(illegalRes.status).toBe(422);

    // 7. Host dá START na partida
    const startReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({
        action: { type: 'START', actorId: hostId },
      }),
    });
    const startRes = await actionPost(startReq, { params: Promise.resolve({ code }) });
    expect(startRes.status).toBe(200);
    const startData = await startRes.json();
    expect(startData.room.phase).toBe('round');
    expect(startData.room.roundNumber).toBe(1);

    // 8. Host avança para apuração de rodada (END_ROUND)
    const endRoundReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({
        action: { type: 'END_ROUND', actorId: hostId },
      }),
    });
    const endRoundRes = await actionPost(endRoundReq, { params: Promise.resolve({ code }) });
    expect(endRoundRes.status).toBe(200);
    const endData = await endRoundRes.json();
    expect(endData.room.phase).toBe('reporting');

    // 9. Jogador reporta dano (SET_DAMAGE) e confirma (CONFIRM)
    const setDmgReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${playerToken}` },
      body: JSON.stringify({
        action: { type: 'SET_DAMAGE', actorId: p2Id, targetId: p2Id, damage: 1 },
      }),
    });
    await actionPost(setDmgReq, { params: Promise.resolve({ code }) });

    const confirmP2Req = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${playerToken}` },
      body: JSON.stringify({
        action: { type: 'CONFIRM', actorId: p2Id },
      }),
    });
    await actionPost(confirmP2Req, { params: Promise.resolve({ code }) });

    // Host também confirma -> aciona revelação automática
    const confirmHostReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({
        action: { type: 'CONFIRM', actorId: hostId },
      }),
    });
    const revealRes = await actionPost(confirmHostReq, { params: Promise.resolve({ code }) });
    const revealData = await revealRes.json();
    expect(revealData.room.phase).toBe('reveal');
    expect(revealData.room.lastReveal).toBeDefined();
  });

  it('TESTE DE SEGURANÇA: nunca vaza "life" em modo oculto, nem senhas/hashes/segredos em qualquer resposta', async () => {
    // Cria sala com vidas ocultas
    const createReq = new NextRequest('http://localhost/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        password: 'senha-super-secreta',
        hostProfile: { name: 'Host Secreto', color: '#111111' },
        config: {
          roomName: 'Arena Invisível',
          lifeVisibility: 'hidden',
          lifeFixed: 5,
        },
      }),
    });
    const createRes = await roomsPost(createReq);
    const { code, token: hostToken, playerId: hostId } = await createRes.json();

    // Entra segundo jogador
    const joinReq = new NextRequest(`http://localhost/api/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ password: 'senha-super-secreta', name: 'Invisível 2', color: '#35B8F4' }),
    });
    const joinRes = await joinPost(joinReq, { params: Promise.resolve({ code }) });
    const { token: p2Token } = await joinRes.json();

    // Inicia a partida
    const startReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ action: { type: 'START', actorId: hostId } }),
    });
    const startRes = await actionPost(startReq, { params: Promise.resolve({ code }) });
    const startData = await startRes.json();

    // 1. Inspeciona a resposta da ação START
    for (const player of startData.room.players) {
      expect(player.life).toBeUndefined();
    }
    const startJsonStr = JSON.stringify(startData);
    expect(startJsonStr).not.toContain('"password"');
    expect(startJsonStr).not.toContain('"password_hash"');
    expect(startJsonStr).not.toContain('"passwordHash"');
    expect(startJsonStr).not.toContain('"secret_state"');
    expect(startJsonStr).not.toContain('"secretState"');

    // 2. Inspeciona a resposta da rota GET /state
    const stateReq = new NextRequest(`http://localhost/api/rooms/${code}/state`, {
      headers: { authorization: `Bearer ${p2Token}` },
    });
    const stateRes = await stateGet(stateReq, { params: Promise.resolve({ code }) });
    const stateData = await stateRes.json();

    for (const player of stateData.room.players) {
      expect(player.life).toBeUndefined();
    }
    const stateJsonStr = JSON.stringify(stateData);
    expect(stateJsonStr).not.toContain('"life":');
    expect(stateJsonStr).not.toContain('"passwordHash"');
    expect(stateJsonStr).not.toContain('"password_hash"');
  });
});
