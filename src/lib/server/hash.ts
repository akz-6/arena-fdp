import 'server-only';
import crypto from 'node:crypto';

const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
};

/**
 * Cria hash scrypt seguro com salt aleatório de 16 bytes.
 * Formato retornado: "salt$derivedKey" em hexadecimal.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      SCRYPT_PARAMS,
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`${salt}$${derivedKey.toString('hex')}`);
      }
    );
  });
}

/**
 * Verifica senha contra hash em tempo constante (evita timing attacks).
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split('$');
  if (!salt || !key) return false;

  return new Promise((resolve) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      SCRYPT_PARAMS,
      (err, derivedKey) => {
        if (err) return resolve(false);
        try {
          const keyBuffer = Buffer.from(key, 'hex');
          const isMatch = crypto.timingSafeEqual(keyBuffer, derivedKey);
          resolve(isMatch);
        } catch {
          resolve(false);
        }
      }
    );
  });
}

/**
 * Gera código de recuperação legível no formato XXXX-XXXX (sem caracteres confusos).
 */
export function generateRecoveryCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let part1 = '';
  let part2 = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 4; i++) {
    part1 += chars[bytes[i]! % chars.length];
    part2 += chars[bytes[i + 4]! % chars.length];
  }
  return `${part1}-${part2}`;
}

/**
 * Hash SHA-256 para códigos de recuperação e segredos de dispositivo.
 */
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret.trim().toUpperCase()).digest('hex');
}

/**
 * Compara dois hashes SHA-256 em tempo constante.
 */
export function verifySecret(secret: string, expectedHash: string): boolean {
  const computed = hashSecret(secret);
  try {
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
