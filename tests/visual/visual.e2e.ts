import { test, expect } from '@playwright/test';

test.describe('L9: Visual Regression & Viewport Stability', () => {
  test('Renderização estável da Home em diferentes resoluções', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verifica elementos visuais essenciais
    const logo = page.locator('header img[alt="Arena FDP Logo"]');
    await expect(logo).toBeVisible();

    const title = page.getByRole('heading', { level: 1 });
    await expect(title).toBeVisible();

    // Garante que não há scroll horizontal indesejado
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // margem de arredondamento de 2px
  });
});
