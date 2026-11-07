#!/usr/bin/env node

/**
 * Script de verificação de ambiente do Arena FDP.
 *
 * Uso:
 *   node scripts/verify-env.mjs                      # Verifica variáveis locais (.env / .env.local)
 *   node scripts/verify-env.mjs https://sua-url.app  # Verifica /api/health remoto
 */

import fs from 'node:fs';
import path from 'node:path';

// Carrega .env e .env.local simples se existirem localmente
function loadEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const targetUrl = process.argv[2];

console.log('='.repeat(65));
console.log('  ARENA FDP - VERIFICAÇÃO DE AMBIENTE');
console.log('='.repeat(65));

if (targetUrl) {
  await verifyRemote(targetUrl);
} else {
  verifyLocal();
}

function printRow(name, status, detail) {
  const nameCol = name.padEnd(30, ' ');
  const statusCol = status === 'OK' ? '\x1b[32m[ OK ]\x1b[0m' : '\x1b[31m[FALTA]\x1b[0m';
  console.log(`${nameCol} | ${statusCol} | ${detail}`);
}

function verifyLocal() {
  console.log('\nModo: Verificação Local de Variáveis de Ambiente\n');
  console.log('Variável                       | Status  | Detalhe');
  console.log('-'.repeat(65));

  let allOk = true;

  // 1. NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('supabase.co')) {
    printRow('NEXT_PUBLIC_SUPABASE_URL', 'OK', 'URL válida do Supabase');
  } else {
    allOk = false;
    printRow('NEXT_PUBLIC_SUPABASE_URL', 'FALTA', 'Ausente ou formato inválido');
  }

  // 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey && anonKey.length > 20) {
    printRow('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'OK', 'Chave pública presente');
  } else {
    allOk = false;
    printRow('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'FALTA', 'Ausente ou muito curta');
  }

  // 3. SUPABASE_SERVICE_ROLE_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && serviceKey.length > 20) {
    printRow('SUPABASE_SERVICE_ROLE_KEY', 'OK', 'Chave secreta presente');
  } else {
    allOk = false;
    printRow('SUPABASE_SERVICE_ROLE_KEY', 'FALTA', 'Ausente ou muito curta');
  }

  // 4. ROOM_TOKEN_SECRET
  const devDefault = 'arena-fdp-insecure-dev-secret-do-not-use-in-production-32chars';
  const tokenSecret = process.env.ROOM_TOKEN_SECRET;
  if (tokenSecret && tokenSecret !== devDefault && tokenSecret.length >= 32) {
    printRow('ROOM_TOKEN_SECRET', 'OK', 'Segredo configurado (>= 32 chars)');
  } else if (tokenSecret === devDefault) {
    allOk = false;
    printRow('ROOM_TOKEN_SECRET', 'FALTA', 'Usando segredo padrão inseguro de dev');
  } else {
    allOk = false;
    printRow('ROOM_TOKEN_SECRET', 'FALTA', 'Ausente ou com menos de 32 caracteres');
  }

  console.log('-'.repeat(65));
  if (allOk) {
    console.log('\n\x1b[32m✔ Todas as variáveis de ambiente necessárias estão configuradas!\x1b[0m\n');
    process.exit(0);
  } else {
    console.log('\n\x1b[31m✖ Existem variáveis pendentes. Consulte INSTRUCOES-VERCEL-SUPABASE.md.\x1b[0m\n');
    process.exit(1);
  }
}

async function verifyRemote(url) {
  const cleanUrl = url.replace(/\/+$/, '');
  const endpoint = `${cleanUrl}/api/health`;
  console.log(`\nModo: Verificação Remota via ${endpoint}\n`);
  console.log('Verificação                    | Status  | Detalhe');
  console.log('-'.repeat(65));

  let allOk = true;

  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) {
      console.log(`\x1b[31mErro HTTP ${res.status} ao acessar ${endpoint}\x1b[0m`);
      process.exitCode = 1;
      return;
    }

    const data = await res.json();

    // Versão
    printRow('Versão da Aplicação', 'OK', `v${data.version || 'desconhecida'}`);

    // Supabase Configurado
    if (data.supabaseConfigured) {
      printRow('Supabase Conectado', 'OK', 'URL e Service Role presentes');
    } else {
      allOk = false;
      printRow('Supabase Conectado', 'FALTA', 'URL ou Service Role ausentes');
    }

    // Realtime Configurado
    if (data.realtimeConfigured) {
      printRow('Realtime Anon Key', 'OK', 'Anon Key configurada');
    } else {
      allOk = false;
      printRow('Realtime Anon Key', 'FALTA', 'Anon Key ausente no frontend');
    }

    // Token Secret OK
    if (data.tokenSecretOk) {
      printRow('ROOM_TOKEN_SECRET', 'OK', 'Segredo válido (>= 32 chars)');
    } else {
      allOk = false;
      printRow('ROOM_TOKEN_SECRET', 'FALTA', 'Segredo ausente, padrão ou curto');
    }

    // Schema OK (tabelas e RPC)
    if (data.schemaOk) {
      printRow('Schema do Banco (SQL)', 'OK', 'Tabelas e cas_update_room ativas');
    } else {
      allOk = false;
      printRow('Schema do Banco (SQL)', 'FALTA', 'Tabelas ou cas_update_room ausentes');
    }

    console.log('-'.repeat(65));
    if (allOk) {
      console.log('\n\x1b[32m✔ Ambiente de produção 100% operacional!\x1b[0m\n');
      process.exitCode = 0;
    } else {
      console.log('\n\x1b[31m✖ Ambiente com pendências de configuração.\x1b[0m\n');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(`\x1b[31mFalha de conexão com ${endpoint}: ${err.message}\x1b[0m`);
    process.exitCode = 1;
  }
}
