import 'server-only';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabase';

export class BackendNotConfiguredError extends Error {
  constructor(message = 'Backend não configurado para ambiente de produção.') {
    super(message);
    this.name = 'BackendNotConfiguredError';
  }
}

/**
 * Retorna true se o backend estiver pronto para atender requisições:
 * 1. Supabase configurado (URL + Service Role Key); OU
 * 2. Repositório em memória explicitamente habilitado (FDP_ALLOW_MEMORY_REPO=1); OU
 * 3. Ambiente de desenvolvimento/teste (NODE_ENV !== 'production').
 */
export function isBackendConfigured(): boolean {
  if (getSupabaseAdmin() !== null) {
    return true;
  }
  if (process.env.FDP_ALLOW_MEMORY_REPO === '1') {
    return true;
  }
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  return false;
}

/**
 * Retorna resposta 503 com corpo tipado { error: "not_configured" }
 * sem vazar stack trace ou detalhes internos.
 */
export function notConfiguredResponse(): NextResponse {
  return NextResponse.json({ error: 'not_configured' }, { status: 503 });
}
