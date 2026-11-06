// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('L2 / L5: Database Row Level Security (RLS) & Anon Access Denial', () => {
  it('A migração SQL ativa RLS estrita em todas as tabelas e revoga acesso de anon', () => {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/0001_init.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. RLS ativa nas três tabelas
    expect(sql).toMatch(/alter\s+table\s+profiles\s+enable\s+row\s+level\s+security;/i);
    expect(sql).toMatch(/alter\s+table\s+rooms\s+enable\s+row\s+level\s+security;/i);
    expect(sql).toMatch(/alter\s+table\s+room_secrets\s+enable\s+row\s+level\s+security;/i);

    // 2. RPC cas_update_room com acesso revogado para anon e public
    expect(sql).toMatch(/revoke\s+all\s+on\s+function\s+cas_update_room\s+from\s+public,\s*anon,\s*authenticated;/i);

    // 3. Nenhuma policy permissiva concedendo acesso a anon
    expect(sql).not.toMatch(/create\s+policy.*to\s+anon\s+using\s*\(\s*true\s*\)/i);
  });
});
