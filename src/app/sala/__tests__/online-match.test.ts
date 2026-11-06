// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as roomsPost } from '@/app/api/rooms/route';
import { POST as joinPost } from '@/app/api/rooms/[code]/join/route';
import { POST as actionPost } from '@/app/api/rooms/[code]/action/route';

describe('Partida Online Multi-Client e Sincronização (Fase 7)', () => {
  it('simula 3 clientes jogando rodadas completas, reporte fora de ordem, edição e avanço', async () => {
    // 1. Host cria sala online
    const createReq = new NextRequest('http://localhost/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        hostProfile: { name: 'Host Pro', color: '#FF3038' },
        config: {
          roomName: 'Arena dos Campeões',
          lifeVisibility: 'visible',
          lifeFixed: 4,
        },
      }),
    });
    const createRes = await roomsPost(createReq);
    expect(createRes.status).toBe(201);
    const { code, token: hostToken, playerId: hostId } = await createRes.json();

    // 2. Cliente 2 entra
    const join2Req = new NextRequest(`http://localhost/api/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Pato Ninja', color: '#35B8F4' }),
    });
    const join2Res = await joinPost(join2Req, { params: Promise.resolve({ code }) });
    const { token: p2Token, playerId: p2Id } = await join2Res.json();

    // 3. Cliente 3 entra
    const join3Req = new NextRequest(`http://localhost/api/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Gato Veloz', color: '#2ECC71' }),
    });
    const join3Res = await joinPost(join3Req, { params: Promise.resolve({ code }) });
    const { token: p3Token, playerId: p3Id } = await join3Res.json();

    // 4. Host inicia a partida (START)
    const startReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ action: { type: 'START', actorId: hostId } }),
    });
    const startRes = await actionPost(startReq, { params: Promise.resolve({ code }) });
    expect(startRes.status).toBe(200);
    const startData = await startRes.json();
    expect(startData.room.phase).toBe('round');
    expect(startData.room.roundNumber).toBe(1);
    expect(startData.room.players.length).toBe(3);

    // 5. Host encerra a mão física (END_ROUND) -> vai para reporting
    const endReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ action: { type: 'END_ROUND', actorId: hostId } }),
    });
    const endRes = await actionPost(endReq, { params: Promise.resolve({ code }) });
    expect(endRes.status).toBe(200);
    const endData = await endRes.json();
    expect(endData.room.phase).toBe('reporting');

    // 6. Confirmação fora de ordem e edição de dano antes da confirmação final:
    // P3 marca dano 2
    await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${p3Token}` },
        body: JSON.stringify({
          action: { type: 'SET_DAMAGE', actorId: p3Id, targetId: p3Id, damage: 2 },
        }),
      }),
      { params: Promise.resolve({ code }) }
    );

    // P3 edita dano para 1 antes de confirmar!
    await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${p3Token}` },
        body: JSON.stringify({
          action: { type: 'SET_DAMAGE', actorId: p3Id, targetId: p3Id, damage: 1 },
        }),
      }),
      { params: Promise.resolve({ code }) }
    );

    // P3 confirma primeiro (fora de ordem)
    const conf3Res = await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${p3Token}` },
        body: JSON.stringify({ action: { type: 'CONFIRM', actorId: p3Id } }),
      }),
      { params: Promise.resolve({ code }) }
    );
    expect(conf3Res.status).toBe(200);
    expect((await conf3Res.json()).room.confirmed).toContain(p3Id);

    // P2 marca dano 1 e confirma
    await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${p2Token}` },
        body: JSON.stringify({
          action: { type: 'SET_DAMAGE', actorId: p2Id, targetId: p2Id, damage: 1 },
        }),
      }),
      { params: Promise.resolve({ code }) }
    );
    await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${p2Token}` },
        body: JSON.stringify({ action: { type: 'CONFIRM', actorId: p2Id } }),
      }),
      { params: Promise.resolve({ code }) }
    );

    // Host confirma por último -> aciona automaticamente a transição para 'reveal'!
    const confHostRes = await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hostToken}` },
        body: JSON.stringify({ action: { type: 'CONFIRM', actorId: hostId } }),
      }),
      { params: Promise.resolve({ code }) }
    );
    const revealData = await confHostRes.json();
    expect(revealData.room.phase).toBe('reveal');
    expect(revealData.room.lastReveal).toBeDefined();
    expect(revealData.room.lastReveal.seed).toBeDefined();

    // 7. Host avança para a próxima rodada (NEXT_ROUND)
    const nextReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ action: { type: 'NEXT_ROUND', actorId: hostId } }),
    });
    const nextRes = await actionPost(nextReq, { params: Promise.resolve({ code }) });
    const nextData = await nextRes.json();
    expect(nextData.room.phase).toBe('round');
    expect(nextData.room.roundNumber).toBe(2);
  });

  it('testa sistema de consenso de vida (+1/-1 com votação unânime e rejeição imediata)', async () => {
    // 1. Cria sala com 3 jogadores
    const createRes = await roomsPost(
      new NextRequest('http://localhost/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          hostProfile: { name: 'Host Votação', color: '#111111' },
          config: { lifeFixed: 5 },
        }),
      })
    );
    const { code, token: hToken, playerId: hId } = await createRes.json();

    const j2 = await joinPost(
      new NextRequest(`http://localhost/api/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Votante 2' }),
      }),
      { params: Promise.resolve({ code }) }
    );
    const { token: t2, playerId: p2Id } = await j2.json();

    const j3 = await joinPost(
      new NextRequest(`http://localhost/api/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Votante 3' }),
      }),
      { params: Promise.resolve({ code }) }
    );
    const { token: t3 } = await j3.json();

    // Inicia partida
    await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hToken}` },
        body: JSON.stringify({ action: { type: 'START', actorId: hId } }),
      }),
      { params: Promise.resolve({ code }) }
    );

    // 2. Jogador 2 propõe +1 vida para o Host
    const propRes = await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${t2}` },
        body: JSON.stringify({
          action: { type: 'PROPOSE_ADJUST', actorId: p2Id, targetId: hId, delta: 1 },
        }),
      }),
      { params: Promise.resolve({ code }) }
    );
    const propData = await propRes.json();
    const proposal = propData.room.proposals[0];
    expect(proposal.status).toBe('pending');
    expect(proposal.approvals).toContain(p2Id); // Proponente já conta como aprovado

    // 3. Jogador 3 rejeita a proposta (VOTE: false) -> deve rejeitar imediatamente
    const voteRes = await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${t3}` },
        body: JSON.stringify({
          action: { type: 'VOTE', actorId: (await verifyPlayerId(t3)), proposalId: proposal.id, approve: false },
        }),
      }),
      { params: Promise.resolve({ code }) }
    );
    const voteData = await voteRes.json();
    const resolvedProp = voteData.room.proposals.find((p: { id: string }) => p.id === proposal.id);
    expect(resolvedProp.status).toBe('rejected');
  });

  it('testa desfazer última rodada (UNDO_LAST_ROUND)', async () => {
    const createRes = await roomsPost(
      new NextRequest('http://localhost/api/rooms', {
        method: 'POST',
        body: JSON.stringify({ hostProfile: { name: 'Host Undo' } }),
      })
    );
    const { code, token: hToken, playerId: hId } = await createRes.json();

    await joinPost(
      new NextRequest(`http://localhost/api/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Player 2' }),
      }),
      { params: Promise.resolve({ code }) }
    );

    // Inicia
    await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hToken}` },
        body: JSON.stringify({ action: { type: 'START', actorId: hId } }),
      }),
      { params: Promise.resolve({ code }) }
    );

    // Avança para apuração e fecha rodada 1 (FORCE_CLOSE)
    await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hToken}` },
        body: JSON.stringify({ action: { type: 'END_ROUND', actorId: hId } }),
      }),
      { params: Promise.resolve({ code }) }
    );

    // Fecha a rodada gerando o snapshot anterior
    await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hToken}` },
        body: JSON.stringify({ action: { type: 'FORCE_CLOSE', actorId: hId } }),
      }),
      { params: Promise.resolve({ code }) }
    );

    // Host desfaz a rodada (UNDO_LAST_ROUND)
    const undoRes = await actionPost(
      new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${hToken}` },
        body: JSON.stringify({ action: { type: 'UNDO_LAST_ROUND', actorId: hId } }),
      }),
      { params: Promise.resolve({ code }) }
    );
    expect(undoRes.status).toBe(200);
    const undoData = await undoRes.json();
    expect(undoData.room.roundNumber).toBe(1);
    expect(undoData.room.phase).toBe('reporting');
  });
});

async function verifyPlayerId(token: string): Promise<string> {
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString('utf-8'));
  return payload.playerId;
}
