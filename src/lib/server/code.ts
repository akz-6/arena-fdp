import 'server-only';
import crypto from 'node:crypto';

// Alfabeto sem 0, 1, I, O para evitar confusão visual
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;

/**
 * Gera um código de sala cartoon único de 6 caracteres.
 */
export function generateRoomCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const byte = bytes[i]!;
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return code;
}

/**
 * Valida o formato de um código de sala.
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();
  if (clean.length !== CODE_LENGTH) return false;
  for (let i = 0; i < clean.length; i++) {
    if (!CODE_ALPHABET.includes(clean[i]!)) return false;
  }
  return true;
}
