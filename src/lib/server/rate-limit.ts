import 'server-only';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Armazenamento em memória (best-effort em arquitetura serverless / instâncias efêmeras)
const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number; // Janela em milissegundos
  max: number; // Máximo de requisições por janela
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Limita requisições por chave (ex: IP + rota).
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60_000, max: 30 }
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // Limpeza de entradas expiradas periodicamente
  if (store.size > 5000) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) {
        store.delete(k);
      }
    }
  }

  if (!entry || entry.resetAt <= now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    store.set(key, newEntry);
    return {
      success: true,
      limit: options.max,
      remaining: options.max - 1,
      resetAt: newEntry.resetAt,
    };
  }

  entry.count++;
  if (entry.count > options.max) {
    return {
      success: false,
      limit: options.max,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    success: true,
    limit: options.max,
    remaining: options.max - entry.count,
    resetAt: entry.resetAt,
  };
}
