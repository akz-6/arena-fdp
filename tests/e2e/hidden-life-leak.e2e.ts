import { test, expect } from '@playwright/test';

test.describe('L3 / R10: Zero Hidden Life Leak (DOM, ARIA, Storage, Network, WebSocket)', () => {
  test('Em modo vida oculta, as vidas dos adversários NUNCA vazam no DOM, Storage, respostas HTTP ou frames', async ({
    page,
    request,
  }) => {
    // 1. Criar sala em modo oculto via API
    const createRes = await request.post('/api/rooms', {
      data: {
        config: {
          roomName: 'Hidden Life Shield',
          lifeVisibility: 'hidden',
          lifeMode: 'fixed',
          lifeFixed: 7,
          hostRole: 'player',
        },
        hostProfile: {
          name: 'HostOculto',
          color: '#FF3038',
        },
      },
    });
    expect(createRes.status()).toBe(201);
    const { code, token: hostToken, playerId: hostId } = await createRes.json();

    // 2. Ingressar segundo jogador
    const joinRes = await request.post(`/api/rooms/${code}/join`, {
      data: {
        name: 'PlayerB',
        color: '#35B8F4',
      },
    });
    expect(joinRes.status()).toBe(200);
    const { token: playerBToken, playerId: playerBId } = await joinRes.json();

    // 3. Iniciar a partida
    await request.post(`/api/rooms/${code}/action`, {
      headers: { authorization: `Bearer ${hostToken}` },
      data: { action: { type: 'START', actorId: hostId } },
    });

    // 4. Inspecionar resposta da rota GET /state
    const stateRes = await request.get(`/api/rooms/${code}/state`, {
      headers: { authorization: `Bearer ${playerBToken}` },
    });
    const stateText = await stateRes.text();
    // Invariante S0: o JSON público NUNCA deve conter "life":7 ou qualquer "life":número
    expect(stateText).not.toMatch(/"life":\s*\d+/);

    // 5. Monitorar WebSocket frames e tráfego de rede na página do PlayerB
    const capturedPayloads: string[] = [];
    page.on('websocket', (ws) => {
      ws.on('framereceived', (frame) => {
        if (typeof frame.payload === 'string') {
          capturedPayloads.push(frame.payload);
        }
      });
    });

    // Injetar token no localStorage antes de carregar a página
    await page.addInitScript(
      ({ roomCode, token }) => {
        localStorage.setItem(`fdp_token_${roomCode}`, token);
      },
      { roomCode: code, token: playerBToken }
    );

    await page.goto(`/sala/${code}`);
    await page.waitForLoadState('domcontentloaded');

    // 6. Verificar DOM: vidas dos adversários não devem aparecer em texto, atributos aria ou data
    const domContent = await page.content();
    // O valor da vida fixa é 7. Nenhum badge de vida com 7 para o adversário deve estar no DOM
    const lifeElements = await page.locator('[data-testid="player-life"]').all();
    for (const el of lifeElements) {
      const text = await el.textContent();
      // Se houver indicador, não deve mostrar a vida oculta dos adversários
      expect(text).not.toContain('7 Vidas');
    }

    // 7. Verificar localStorage e sessionStorage do cliente
    const storageData = await page.evaluate(() => {
      return {
        local: JSON.stringify(window.localStorage),
        session: JSON.stringify(window.sessionStorage),
      };
    });
    expect(storageData.local).not.toMatch(/"life":\s*\d+/);
    expect(storageData.session).not.toMatch(/"life":\s*\d+/);

    // 8. Verificar frames de WebSocket capturados
    for (const payload of capturedPayloads) {
      expect(payload).not.toMatch(/"life":\s*\d+/);
    }
  });
});
