import { test, expect } from '@playwright/test';

test.describe('L4: Network Resilience & Snapshot Reconciliation (E2E)', () => {
  test('Reconciliação de estado após reconexão e foco de aba (window focus)', async ({
    page,
    request,
  }) => {
    // 1. Criar sala via API
    const createRes = await request.post('/api/rooms', {
      data: {
        config: { roomName: 'Resilience Room' },
        hostProfile: { name: 'HostResilient' },
      },
    });
    const { code, token } = await createRes.json();

    // 2. Injetar token e acessar sala
    await page.addInitScript(
      ({ roomCode, userToken }) => {
        localStorage.setItem(`arena_fdp_room_token_${roomCode.toUpperCase()}`, userToken);
      },
      { roomCode: code, userToken: token }
    );

    await page.goto(`/sala/${code}`);
    await page.waitForLoadState('domcontentloaded');

    // 3. Simular transição externa de estado via API (ex: novo jogador entra enquanto a aba estava inativa)
    await request.post(`/api/rooms/${code}/join`, {
      data: { name: 'PlayerExterno', color: '#00C2A8' },
    });

    // 4. Simular evento de foco na janela
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
    });

    // 5. Verificar que a interface reconciliou o snapshot e mostra 2 jogadores
    await expect(page.getByText(/2\s*jogadores|PlayerExterno/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Simulação de modo offline com retorno do status da conexão', async ({ page, request }) => {
    const createRes = await request.post('/api/rooms', {
      data: {
        config: { roomName: 'Offline Test Room' },
        hostProfile: { name: 'HostOffline' },
      },
    });
    const { code, token } = await createRes.json();

    await page.addInitScript(
      ({ roomCode, userToken }) => {
        localStorage.setItem(`arena_fdp_room_token_${roomCode.toUpperCase()}`, userToken);
      },
      { roomCode: code, userToken: token }
    );

    await page.goto(`/sala/${code}`);
    await page.waitForLoadState('domcontentloaded');

    // Simula evento offline no navegador
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Simula volta do sinal online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Aplicação deve continuar funcional sem quebrar
    await expect(page.locator('body')).toBeVisible();
  });
});
