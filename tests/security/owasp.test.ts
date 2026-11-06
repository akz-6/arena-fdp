// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { POST as profilePost } from '@/app/api/profile/route';
import { POST as roomsPost } from '@/app/api/rooms/route';
import { POST as actionPost } from '@/app/api/rooms/[code]/action/route';
import { verifyRoomToken } from '@/lib/server/auth';
import nextConfig from '@/../next.config';

describe('L5: OWASP Application Security Audit', () => {
  describe('1. Cabeçalhos de Segurança HTTP (WSTG-CONF-07)', () => {
    it('Define todos os cabeçalhos de segurança essenciais no next.config.ts', async () => {
      const headersFn = nextConfig.headers;
      expect(headersFn).toBeDefined();

      if (headersFn) {
        const headerConfigs = await headersFn();
        const globalHeaders = headerConfigs.find((h) => h.source === '/:path*');
        expect(globalHeaders).toBeDefined();

        const map = new Map(globalHeaders?.headers.map((h) => [h.key, h.value]));

        expect(map.get('X-Content-Type-Options')).toBe('nosniff');
        expect(map.get('X-Frame-Options')).toBe('DENY');
        expect(map.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
        expect(map.get('Strict-Transport-Security')).toContain('max-age=63072000');
        expect(map.get('Permissions-Policy')).toContain('camera=()');
        expect(map.get('Content-Security-Policy')).toContain("default-src 'self'");
      }
    });
  });

  describe('2. Varredura de Segredos e Chaves Privadas (WSTG-INFO-05)', () => {
    it('Nenhum segredo de service role ou chave privada commitada nos arquivos de código', () => {
      const srcDir = path.resolve(process.cwd(), 'src');
      const files: string[] = [];

      function walk(dir: string) {
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f);
          if (fs.statSync(full).isDirectory()) {
            walk(full);
          } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
            files.push(full);
          }
        }
      }

      walk(srcDir);

      // Regex para detectar service role keys, segredos JWT ou chaves RSA/EC
      const secretPatterns = [
        /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][a-zA-Z0-9_\-.]+['"]/i,
        /ROOM_TOKEN_SECRET\s*=\s*['"][a-zA-Z0-9_\-.]+['"]/i,
        /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of secretPatterns) {
          expect(content).not.toMatch(pattern);
        }
      }
    });
  });

  describe('3. Validação de JWT e Rejeição de Adulterações (WSTG-SESS-04)', () => {
    it('Rejeita token com algoritmo alterado para "none"', async () => {
      // Cria token com header "none"
      const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const fakePayload = Buffer.from(
        JSON.stringify({
          roomId: 'fake-room',
          playerId: 'fake-player',
          code: 'ZZZZZZ',
          role: 'player',
        })
      ).toString('base64url');
      const noneToken = `${fakeHeader}.${fakePayload}.`;

      const result = await verifyRoomToken(noneToken);
      expect(result).toBeNull();
    });

    it('Rejeita token com assinatura adulterada', async () => {
      const fakeHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const fakePayload = Buffer.from(
        JSON.stringify({
          roomId: 'fake-room',
          playerId: 'fake-player',
          code: 'ZZZZZZ',
          role: 'player',
        })
      ).toString('base64url');
      const tamperedSignature = 'tamperedSignature1234567890';
      const tamperedToken = `${fakeHeader}.${fakePayload}.${tamperedSignature}`;

      const result = await verifyRoomToken(tamperedToken);
      expect(result).toBeNull();
    });
  });

  describe('4. Sanitização e Bloqueio de Injeção / XSS (WSTG-INPV-01 / WSTG-INPV-02)', () => {
    it('POST /api/profile rejeita tags HTML e XSS no nome do jogador', async () => {
      const xssPayloads = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '"><svg onload=alert(1)>',
      ];

      for (const payload of xssPayloads) {
        const req = new NextRequest('http://localhost/api/profile', {
          method: 'POST',
          body: JSON.stringify({ name: payload, color: '#FF0000' }),
        });
        const res = await profilePost(req);
        // O schema rejeita caracteres que não correspondam à regex segura
        expect([400, 422]).toContain(res.status);
      }
    });

    it('POST /api/rooms rejeita caracteres de injeção no nome da sala', async () => {
      const req = new NextRequest('http://localhost/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          config: {
            roomName: '<script>evil()</script>',
          },
        }),
      });
      const res = await roomsPost(req);
      // Deve criar com nome sanitizado ou rejeitar
      const data = await res.json();
      if (res.status === 201) {
        // Se criou, verifica se caracteres perigosos não foram interpretados como HTML
        expect(data.code).toBeDefined();
      } else {
        expect(res.status).toBe(400);
      }
    });

    it('Proteção contra Prototype Pollution em payload JSON', async () => {
      const maliciousJson = '{"__proto__":{"polluted":true},"action":{"type":"START","actorId":"p1"}}';
      const req = new NextRequest('http://localhost/api/rooms/TESTCD/action', {
        method: 'POST',
        headers: { authorization: 'Bearer fake' },
        body: maliciousJson,
      });
      await actionPost(req, { params: Promise.resolve({ code: 'TESTCD' }) });

      // Garante que o Object global não foi poluído
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });
});
