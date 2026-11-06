const TOKEN_PREFIX = 'arena_fdp_room_token_';

export function getRoomToken(code: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(`${TOKEN_PREFIX}${code.toUpperCase()}`);
  } catch {
    return null;
  }
}

export function setRoomToken(code: string, token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${TOKEN_PREFIX}${code.toUpperCase()}`, token);
  } catch (err) {
    console.error('Erro ao salvar token da sala:', err);
  }
}

export function removeRoomToken(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${TOKEN_PREFIX}${code.toUpperCase()}`);
  } catch {
    // Ignore
  }
}
