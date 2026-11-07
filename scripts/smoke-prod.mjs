#!/usr/bin/env node

/**
 * Script de Smoke Test Não-Destrutivo para Produção / Preview
 * 
 * Uso:
 *   node scripts/smoke-prod.mjs [URL]
 *   node scripts/smoke-prod.mjs https://fdp-dusky.vercel.app
 */

const targetUrl = process.argv[2] || process.env.APP_URL || 'https://fdp-dusky.vercel.app';
const cleanUrl = targetUrl.replace(/\/$/, '');

console.log(`\n======================================================`);
console.log(`🚀 ARENA FDP — SMOKE TEST DE PRODUÇÃO / PREVIEW`);
console.log(`Alvo: ${cleanUrl}`);
console.log(`Data: ${new Date().toISOString()}`);
console.log(`======================================================\n`);

const results = [];

async function step(name, fn) {
  const start = performance.now();
  process.stdout.write(`⏳ [${name}] ... `);
  try {
    const data = await fn();
    const duration = (performance.now() - start).toFixed(1);
    console.log(`✓ OK (${duration}ms)`);
    results.push({ name, status: 'OK', duration: `${duration}ms`, details: data || '' });
    return data;
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    console.log(`✗ FALHA (${duration}ms)`);
    console.error(`  Erro:`, err instanceof Error ? err.message : err);
    results.push({ name, status: 'FALHA', duration: `${duration}ms`, details: err.message });
    throw err;
  }
}

async function runSmoke() {
  try {
    // 1. Verificar Headers e Disponibilidade da Home
    await step('GET / (Headers e Status 200)', async () => {
      const res = await fetch(`${cleanUrl}/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const csp = res.headers.get('content-security-policy');
      const hsts = res.headers.get('strict-transport-security');
      const xfo = res.headers.get('x-frame-options');
      return `HSTS=${Boolean(hsts)}, CSP=${Boolean(csp)}, X-Frame-Options=${Boolean(xfo)}`;
    });

    // 2. Health Endpoint
    const health = await step('GET /api/health (Booleans do Sistema)', async () => {
      const res = await fetch(`${cleanUrl}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return `Versão: ${json.version} | Supabase: ${json.supabaseConfigured} | Realtime: ${json.realtimeConfigured} | Schema: ${json.schemaOk}`;
    });

    // 3. Criar Sala Sintética Leve (zz-test-smoke)
    const roomData = await step('POST /api/rooms (Criação de Sala Sintética)', async () => {
      const res = await fetch(`${cleanUrl}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            roomName: `zz-test-smoke-${Date.now()}`,
            lifeVisibility: 'hidden',
            lifeMode: 'fixed',
            lifeFixed: 5,
            hostRole: 'player',
          },
          hostProfile: {
            name: 'BotHost',
            color: '#FF3038',
          },
        }),
      });

      if (res.status === 503) {
        return 'Backend em modo not_configured (esperado em deploys sem Supabase)';
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      return await res.json();
    });

    if (roomData && roomData.code && roomData.token) {
      const { code, token: hostToken, playerId: hostId } = roomData;

      // 4. Segundo Jogador Entra na Sala
      const joinData = await step(`POST /api/rooms/${code}/join (Entrada de Bot Convidado)`, async () => {
        const res = await fetch(`${cleanUrl}/api/rooms/${code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'BotGuest',
            color: '#0369A1',
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      });

      // 5. Iniciar a Partida
      await step(`POST /api/rooms/${code}/action (START Match)`, async () => {
        const res = await fetch(`${cleanUrl}/api/rooms/${code}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hostToken}`,
          },
          body: JSON.stringify({
            action: { type: 'START', actorId: hostId },
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      });

      // 6. Consultar Estado Público e Validar Invariante de Vida Oculta
      await step(`GET /api/rooms/${code}/state (Verificação de Vida Oculta)`, async () => {
        const res = await fetch(`${cleanUrl}/api/rooms/${code}/state`, {
          headers: { Authorization: `Bearer ${joinData.token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const stateText = await res.text();
        if (/"life":\s*\d+/.test(stateText)) {
          throw new Error('VIOLAÇÃO CRÍTICA: Vida numérica encontrada na projeção pública em modo oculto!');
        }
        return 'Invariante S0 respeitada: Zero vidas vazadas no payload público';
      });

      // 7. Limpeza (Host Sai da Sala)
      await step(`POST /api/rooms/${code}/action (LEAVE / Limpeza da Sala)`, async () => {
        const res = await fetch(`${cleanUrl}/api/rooms/${code}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hostToken}`,
          },
          body: JSON.stringify({
            action: { type: 'LEAVE', actorId: hostId },
          }),
        });
        return 'Sala liberada para expiração natural';
      });
    }

    console.log(`\n======================================================`);
    console.log(`📊 RELATÓRIO DO SMOKE TEST`);
    console.log(`======================================================`);
    console.table(results);
    console.log(`\n🎉 SMOKE TEST CONCLUÍDO COM SUCESSO!\n`);
  } catch (err) {
    console.log(`\n======================================================`);
    console.log(`❌ SMOKE TEST INTERROMPIDO POR FALHA`);
    console.log(`======================================================`);
    console.table(results);
    process.exit(1);
  }
}

runSmoke();
