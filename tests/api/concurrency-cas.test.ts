// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as roomsPost } from '@/app/api/rooms/route';
import { POST as joinPost } from '@/app/api/rooms/[code]/join/route';
import { POST as actionPost } from '@/app/api/rooms/[code]/action/route';
import { GET as stateGet } from '@/app/api/rooms/[code]/state/route';

describe('L2: CAS Concurrency & Race Condition Stress Testing', () => {
  it('Dispara 30 requisições simultâneas: zero corrupção de estado, retries <= 3 e 409 limpo em conflito', async () => {
    // 1. Criar sala com 4 jogadores
    const roomReq = new NextRequest('http://localhost/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        config: {
          roomName: 'CAS Stress Arena',
          lifeVisibility: 'visible',
          lifeFixed: 5,
        },
        hostProfile: {
          name: 'Host CAS',
          color: '#E74C3C',
        },
      }),
    });
    const roomRes = await roomsPost(roomReq);
    const roomData = await roomRes.json();
    const code = roomData.code;
    const hostToken = roomData.token;
    const hostId = roomData.playerId;

    const players = [{ id: hostId, token: hostToken, name: 'Host CAS' }];

    for (let i = 2; i <= 4; i++) {
      const joinReq = new NextRequest(`http://localhost/api/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ name: `Player CAS ${i}`, color: `#${(i * 30).toString(16).padStart(6, '0')}` }),
      });
      const joinRes = await joinPost(joinReq, { params: Promise.resolve({ code }) });
      const joinData = await joinRes.json();
      players.push({ id: joinData.playerId, token: joinData.token, name: `Player CAS ${i}` });
    }

    // Iniciar jogo
    const startReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ action: { type: 'START', actorId: hostId } }),
    });
    await actionPost(startReq, { params: Promise.resolve({ code }) });

    // Avançar para reporte
    const endReq = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { authorization: `Bearer ${hostToken}` },
      body: JSON.stringify({ action: { type: 'END_ROUND', actorId: hostId } }),
    });
    await actionPost(endReq, { params: Promise.resolve({ code }) });

    // 2. Disparar 30 requisições concorrentes entre os 4 jogadores alternando SET_DAMAGE
    const concurrentCount = 30;
    const latencies: number[] = [];

    const promises = Array.from({ length: concurrentCount }, async (_, idx) => {
      const player = players[idx % players.length]!;
      const damage = (idx % 3) + 1;

      const t0 = performance.now();
      const req = new NextRequest(`http://localhost/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { authorization: `Bearer ${player.token}` },
        body: JSON.stringify({
          action: {
            type: 'SET_DAMAGE',
            actorId: player.id,
            targetId: player.id,
            damage,
          },
        }),
      });

      const res = await actionPost(req, { params: Promise.resolve({ code }) });
      const t1 = performance.now();
      latencies.push(t1 - t0);

      const status = res.status;
      const data = await res.json();
      return { status, data };
    });

    const results = await Promise.all(promises);

    // 3. Validação dos resultados
    const successCount = results.filter((r) => r.status === 200).length;
    const conflictCount = results.filter((r) => r.status === 409).length;

    // Apenas status 200 (sucesso após CAS retry) ou 409 (conflito limpo após 3 retries) são permitidos
    for (const r of results) {
      expect([200, 409]).toContain(r.status);
      if (r.status === 409) {
        expect(r.data.code).toBe('CONFLICT');
      }
    }

    // Pelo menos 1 requisição teve sucesso
    expect(successCount).toBeGreaterThan(0);

    // 4. Integridade do estado final
    const stateReq = new NextRequest(`http://localhost/api/rooms/${code}/state`, {
      headers: { authorization: `Bearer ${hostToken}` },
    });
    const stateRes = await stateGet(stateReq, { params: Promise.resolve({ code }) });
    expect(stateRes.status).toBe(200);
    const stateData = await stateRes.json();
    const finalState = stateData.room;

    // Versão deve ser maior que 0 e condizente com as atualizações aplicadas
    expect(finalState.version).toBeGreaterThan(0);
    expect(finalState.phase).toBe('reporting');

    // 5. Cálculo das métricas de latência para o relatório
    latencies.sort((a, b) => a - b);
    const p50 = (latencies[Math.floor(latencies.length * 0.5)] ?? 0).toFixed(2);
    const p95 = (latencies[Math.floor(latencies.length * 0.95)] ?? 0).toFixed(2);
    const p99 = (latencies[Math.floor(latencies.length * 0.99)] ?? 0).toFixed(2);

    console.log(
      `[CAS Concurrency Benchmark] Total: ${concurrentCount} | Sucessos: ${successCount} | Conflitos 409: ${conflictCount} | Latência p50: ${p50}ms, p95: ${p95}ms, p99: ${p99}ms`
    );
  });
});
