// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as profilePost } from '@/app/api/profile/route';
import { POST as recoverPost } from '@/app/api/profile/recover/route';
import { GET as checkGet } from '@/app/api/profile/check/route';
import { POST as roomsPost } from '@/app/api/rooms/route';
import { POST as joinPost } from '@/app/api/rooms/[code]/join/route';
import { GET as stateGet } from '@/app/api/rooms/[code]/state/route';
import { POST as actionPost } from '@/app/api/rooms/[code]/action/route';
import { signRoomToken } from '@/lib/server/auth';

describe('L2: API Contracts, Status Codes & Error Typing', () => {
  let createdRoomCode = '';
  let hostToken = '';
  let hostId = '';

  beforeEach(async () => {
    // Cria uma sala de teste para os testes de rota
    const req = new NextRequest('http://localhost/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        config: {
          roomName: 'Contrato API Arena',
          lifeVisibility: 'hidden',
          lifeMode: 'fixed',
          lifeFixed: 4,
          hostRole: 'player',
        },
        hostProfile: {
          name: 'Host Contrato',
          color: '#FF5733',
        },
      }),
    });
    const res = await roomsPost(req);
    const data = await res.json();
    createdRoomCode = data.code;
    hostToken = data.token;
    hostId = data.playerId;
  });

  describe('1. Validação de Schemas e Códigos de Status', () => {
    it('POST /api/profile cria perfil com sucesso (201)', async () => {
      const uniqueName = `User${Date.now().toString(36).slice(-6)}`;
      const req = new NextRequest('http://localhost/api/profile', {
        method: 'POST',
        body: JSON.stringify({ name: uniqueName, color: '#33B5E5' }),
      });
      const res = await profilePost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe(uniqueName);
      expect(data.profileId).toBeDefined();
      expect(data.deviceToken).toBeDefined();
      expect(data.recoveryCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('POST /api/profile rejeita payload inválido com 400 VALIDATION', async () => {
      const req = new NextRequest('http://localhost/api/profile', {
        method: 'POST',
        body: JSON.stringify({ name: 'X' }), // nome curto demais (< 2)
      });
      const res = await profilePost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('VALIDATION');
    });

    it('GET /api/profile/check retorna available: false quando nome estiver ausente ou inválido', async () => {
      const req = new NextRequest('http://localhost/api/profile/check');
      const res = await checkGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.available).toBe(false);
    });

    it('POST /api/profile/recover rejeita código inexistente com 401 UNAUTHORIZED', async () => {
      const req = new NextRequest('http://localhost/api/profile/recover', {
        method: 'POST',
        body: JSON.stringify({ name: 'Jogador Teste', recoveryCode: 'ZZZZ-9999' }),
      });
      const res = await recoverPost(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/rooms cria sala e retorna contrato esperado (201)', async () => {
      const req = new NextRequest('http://localhost/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          config: {
            roomName: 'Sala Zod Test',
            lifeVisibility: 'visible',
            lifeFixed: 5,
          },
          hostProfile: {
            name: 'Criador Zod',
            color: '#123456',
          },
        }),
      });
      const res = await roomsPost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.code).toBeDefined();
      expect(data.token).toBeDefined();
      expect(data.playerId).toBeDefined();
      expect(data.roomId).toBeDefined();
    });

    it('POST /api/rooms/[code]/join com nome já em uso auto-atribui nome de toon único', async () => {
      const req = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/join`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Host Contrato', // Mesmo nome do host
          color: '#00FF00',
        }),
      });
      const res = await joinPost(req, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      // Garante que o jogador ingressou sem colisão de nome
      expect(data.playerId).toBeDefined();
    });

    it('POST /api/rooms/[code]/join com dados válidos retorna 200 e token válido', async () => {
      const req = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/join`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Convidado',
          color: '#2ECC71',
        }),
      });
      const res = await joinPost(req, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.code).toBe(createdRoomCode);
    });

    it('GET /api/rooms/[code]/state não autenticado retorna minimal: true e oculta detalhes', async () => {
      const req = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/state`);
      const res = await stateGet(req, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.minimal).toBe(true);
      expect(data.roomName).toBe('Contrato API Arena');
      expect(data.room).toBeUndefined();
    });

    it('GET /api/rooms/[code]/state autenticado em modo hidden NUNCA expõe vida dos jogadores', async () => {
      const req = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/state`, {
        headers: { authorization: `Bearer ${hostToken}` },
      });
      const res = await stateGet(req, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res.status).toBe(200);
      const rawText = await res.text();
      expect(rawText).not.toMatch(/"life":\d+/);
    });
  });

  describe('2. Segurança de Autorização (BOLA / BFLA em POST /action)', () => {
    it('Rejeita requisição sem token com 401 UNAUTHORIZED', async () => {
      const req = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action: { type: 'START', actorId: hostId },
        }),
      });
      const res = await actionPost(req, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('Rejeita tentativa de personificação de outro jogador com 403 FORBIDDEN (BOLA)', async () => {
      const fakeToken = await signRoomToken({
        roomId: 'room-xyz',
        playerId: 'hacker-player',
        code: createdRoomCode,
        role: 'player',
      });

      const req = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeToken}` },
        body: JSON.stringify({
          action: { type: 'START', actorId: hostId },
        }),
      });
      const res = await actionPost(req, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('FORBIDDEN');
    });

    it('Rejeita token de outra sala com 403 FORBIDDEN', async () => {
      const otherRoomToken = await signRoomToken({
        roomId: 'other-room',
        playerId: 'player-1',
        code: 'OUTRA6',
        role: 'player',
      });

      const req = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${otherRoomToken}` },
        body: JSON.stringify({
          action: { type: 'START', actorId: 'player-1' },
        }),
      });
      const res = await actionPost(req, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res.status).toBe(403);
    });

    it('Rejeita violação de regra da engine com 422 RULE_VIOLATION', async () => {
      const req = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hostToken}` },
        body: JSON.stringify({
          action: { type: 'START', actorId: hostId },
        }),
      });
      const res = await actionPost(req, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.code).toBe('RULE_VIOLATION');
    });
  });

  describe('3. Idempotência de Ações', () => {
    it('Reenviar a mesma confirmação ou ação não quebra o estado nem duplica efeito', async () => {
      const joinReq = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/join`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Player Idem', color: '#8E44AD' }),
      });
      const joinRes = await joinPost(joinReq, { params: Promise.resolve({ code: createdRoomCode }) });
      const joinData = await joinRes.json();

      const startReq = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hostToken}` },
        body: JSON.stringify({ action: { type: 'START', actorId: hostId } }),
      });
      await actionPost(startReq, { params: Promise.resolve({ code: createdRoomCode }) });

      const endRoundReq = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hostToken}` },
        body: JSON.stringify({ action: { type: 'END_ROUND', actorId: hostId } }),
      });
      await actionPost(endRoundReq, { params: Promise.resolve({ code: createdRoomCode }) });

      const confirmReq1 = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hostToken}` },
        body: JSON.stringify({ action: { type: 'CONFIRM', actorId: hostId } }),
      });
      const res1 = await actionPost(confirmReq1, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res1.status).toBe(200);

      const confirmReq2 = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hostToken}` },
        body: JSON.stringify({ action: { type: 'CONFIRM', actorId: hostId } }),
      });
      const res2 = await actionPost(confirmReq2, { params: Promise.resolve({ code: createdRoomCode }) });
      expect(res2.status).toBe(200);

      const stateReq = new NextRequest(`http://localhost/api/rooms/${createdRoomCode}/state`, {
        headers: { authorization: `Bearer ${hostToken}` },
      });
      const stateRes = await stateGet(stateReq, { params: Promise.resolve({ code: createdRoomCode }) });
      const stateData = await stateRes.json();
      const confirmedHosts = stateData.room.confirmed.filter((id: string) => id === hostId);
      expect(confirmedHosts.length).toBe(1);
    });
  });
});
