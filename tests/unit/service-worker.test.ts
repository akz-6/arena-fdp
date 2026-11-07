import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import nextConfig from '@/../next.config';

describe('P1.1 - Service Worker e Headers', () => {
  const swCode = fs.readFileSync(path.resolve(process.cwd(), 'public/sw.js'), 'utf-8');

  it('define versão atualizada do cache (v2+) e apaga caches antigos', () => {
    expect(swCode).toMatch(/CACHE_NAME\s*=\s*['"]arena-fdp-v2/);
    expect(swCode).toContain('caches.delete');
    expect(swCode).toContain('skipWaiting');
    expect(swCode).toContain('clients.claim');
  });

  it('NUNCA intercepta nem cacheia rotas /api/*, /sala/* ou domínios do Supabase', () => {
    // Verifica regras explícitas no fetch handler
    expect(swCode).toContain("pathname.startsWith('/api/')");
    expect(swCode).toContain("pathname.startsWith('/sala/')");
    expect(swCode).toContain('supabase.co');
  });

  it('configura Cache-Control no-cache para sw.js no next.config.ts', async () => {
    const headersConfig = typeof nextConfig.headers === 'function' ? await nextConfig.headers() : [];
    const swHeader = headersConfig.find((h: { source: string }) => h.source === '/sw.js');
    expect(swHeader).toBeDefined();

    const cacheControl = swHeader?.headers.find(
      (h: { key: string }) => h.key.toLowerCase() === 'cache-control'
    );
    expect(cacheControl).toBeDefined();
    expect(cacheControl?.value).toContain('no-cache');
  });
});
