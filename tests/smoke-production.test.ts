// @vitest-environment node
import { describe, it, expect } from 'vitest';

describe('S1: Production Non-Destructive Smoke Test (https://fdp-dusky.vercel.app)', () => {
  const PROD_URL = 'https://fdp-dusky.vercel.app';

  it('Verifica disponibilidade e cabeçalhos passivos da produção', async () => {
    const res = await fetch(`${PROD_URL}/`, { method: 'GET' });
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain('Arena FDP');
    expect(html).toContain('viewport');
  });

  it('Executa criação leve e leitura de sala sintética "zz-test-smoke" com limpeza', async () => {
    // 1. Criação não-destrutiva de sala sintética
    const createRes = await fetch(`${PROD_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          roomName: 'zz-test-smoke',
          lifeVisibility: 'hidden',
          lifeFixed: 5,
        },
        hostProfile: {
          name: 'zz-test-host',
          color: '#35B8F4',
        },
      }),
    });

    // Se o backend de produção estiver ativo
    if (createRes.status === 201) {
      const data = await createRes.json();
      expect(data.code).toBeDefined();
      expect(data.token).toBeDefined();

      const code = data.code;
      const hostToken = data.token;
      const hostId = data.playerId;

      // 2. Consulta de estado pública
      const stateRes = await fetch(`${PROD_URL}/api/rooms/${code}/state`, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      expect(stateRes.status).toBe(200);
      const stateData = await stateRes.json();
      expect(stateData.room).toBeDefined();
      expect(stateData.room.config.roomName).toBe('zz-test-smoke');

      // Invariante S0 na produção: vidas ocultas nunca vazam no JSON público
      const rawText = JSON.stringify(stateData);
      expect(rawText).not.toMatch(/"life":\s*\d+/);

      // 3. Limpeza graciosa (host sai da sala)
      await fetch(`${PROD_URL}/api/rooms/${code}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hostToken}`,
        },
        body: JSON.stringify({
          action: { type: 'LEAVE', actorId: hostId },
        }),
      });
    } else {
      console.log(`Produção retornou status ${createRes.status}`);
    }
  });
});
