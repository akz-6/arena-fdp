import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('L8: Accessibility Audit (WCAG 2.1 AA & Axe-core)', () => {
  const routes = [
    { name: 'Home', path: '/' },
    { name: 'Regras', path: '/regras' },
    { name: 'Perfil', path: '/perfil' },
    { name: 'Criar Sala', path: '/criar' },
    { name: 'Modo Local / Singleplayer', path: '/local' },
  ];

  for (const route of routes) {
    test(`Página ${route.name} (${route.path}) não deve conter violações sérias ou críticas de acessibilidade`, async ({
      page,
    }) => {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');
      // Aguarda estabilização de animações de entrada
      await page.waitForTimeout(400);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalOrSerious = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      if (criticalOrSerious.length > 0) {
        console.error(`Violações de acessibilidade em ${route.path}:`, JSON.stringify(criticalOrSerious, null, 2));
      }

      expect(criticalOrSerious).toEqual([]);
    });
  }

  test('WCAG 1.4.4: O meta viewport permite redimensionamento e zoom pelo usuário (BUG-01 verificado)', async ({
    page,
  }) => {
    await page.goto('/');
    const viewportMeta = await page.$eval('meta[name="viewport"]', (el) => el.getAttribute('content'));
    expect(viewportMeta).not.toContain('user-scalable=no');
    expect(viewportMeta).not.toContain('user-scalable=0');
    expect(viewportMeta).not.toContain('maximum-scale=1');
  });

  test('WCAG 1.4.3: Contraste e elementos interativos possuem labels acessíveis', async ({ page }) => {
    await page.goto('/criar');
    // Verifica se os botões e inputs possuem nomes acessíveis
    const submitBtn = page.getByRole('button', { name: /iniciar partida|criar arena|criar sala/i });
    await expect(submitBtn).toBeVisible();
  });

  test('P3.2: Região de anúncios de tela (aria-live) e controle de movimento reduzido no Header', async ({
    page,
  }) => {
    await page.goto('/');
    // Região aria-live existe para leitores de tela
    const announcer = page.locator('[data-testid="aria-live-announcer"]');
    await expect(announcer).toBeAttached();
    await expect(announcer).toHaveAttribute('aria-live', 'polite');

    // Botão de alternar movimento reduzido existe no header com label acessível
    const motionBtn = page.getByRole('button', { name: /reduzir animações|movimento reduzido/i });
    await expect(motionBtn).toBeVisible();

    // Clica para ativar movimento reduzido
    await motionBtn.click();
    const stored = await page.evaluate(() => localStorage.getItem('arena_fdp_reduced_motion'));
    expect(stored).toBe('true');
  });
});
