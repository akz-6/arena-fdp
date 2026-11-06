import { test, expect } from '@playwright/test';

test.describe('L3: Multi-player Realtime Game Flow (E2E)', () => {
  test('R01 / R02 / R03: Criação de sala, entrada via código minúsculo e atualização de lobby', async ({
    context,
  }) => {
    const hostPage = await context.newPage();
    const guestPage = await context.newPage();

    // 1. Host acessa página de criação
    await hostPage.goto('/criar');
    await hostPage.fill('input[placeholder*="Arena"], input[name="roomName"]', 'Arena E2E Test');

    // Clica no botão de criar sala
    const createBtn = hostPage.getByRole('button', { name: /criar sala/i });
    await createBtn.click();

    // Aguarda redirecionamento para /sala/[code]
    await hostPage.waitForURL(/\/sala\/[A-Z0-9]{6}/);
    const roomUrl = hostPage.url();
    const codeMatch = roomUrl.match(/\/sala\/([A-Z0-9]{6})/);
    expect(codeMatch).not.toBeNull();
    const code = (codeMatch ? codeMatch[1] : '') as string;

    // Verifica que o host está no lobby
    await expect(hostPage.getByText(/lobby/i).first()).toBeVisible();

    // 2. Convidado entra na sala usando código em minúsculas
    await guestPage.goto('/');
    const codeInput = guestPage.locator('input[placeholder*="Código"], input[name="code"]');
    if (await codeInput.isVisible()) {
      await codeInput.fill(code.toLowerCase());
      const joinBtn = guestPage.getByRole('button', { name: /entrar/i });
      await joinBtn.click();
    } else {
      await guestPage.goto(`/sala/${code.toLowerCase()}`);
    }

    await guestPage.waitForURL(new RegExp(`/sala/${code}`, 'i'));

    // Se aparecer o modal/dialog de entrada, preenche nome e confirma
    const joinSubmitBtn = guestPage.getByRole('button', { name: /entrar na sala|jogar/i });
    if (await joinSubmitBtn.isVisible()) {
      const nameInput = guestPage.locator('input[placeholder*="Nome"], input[name="name"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('ConvidadoE2E');
      }
      await joinSubmitBtn.click();
    }

    // 3. Lobby atualizado com 2 jogadores
    await expect(hostPage.getByText(/2\s*jogadores|2\s*participantes/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('R09: Telão público acessível em /sala/[code]/telao sem exigir login', async ({
    page,
    request,
  }) => {
    // 1. Criar sala via API
    const createRes = await request.post('/api/rooms', {
      data: {
        config: { roomName: 'Telão Arena' },
        hostProfile: { name: 'HostTelao' },
      },
    });
    const { code } = await createRes.json();

    // 2. Acessar rota do telão
    await page.goto(`/sala/${code}/telao`);
    await page.waitForLoadState('domcontentloaded');

    // Telão deve renderizar sem redirecionar para login
    await expect(page.getByText(/telão|arena/i).first()).toBeVisible();
    expect(page.url()).toContain(`/sala/${code}/telao`);
  });
});
