-- ===================================================
-- ARENA FDP — Migração Inicial de Banco de Dados
-- ===================================================

create extension if not exists pgcrypto;

-- 1. Perfis globais (apelido único sem necessidade de login por email)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 16),
  name_key text generated always as (lower(name)) stored,
  color text not null,
  device_secret_hash text not null,
  recovery_hash text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_name_key_uq on profiles (name_key);

-- 2. Salas de jogo ativas
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  status text not null default 'lobby' check (status in ('lobby','playing','finished')),
  public_state jsonb not null,
  version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create unique index if not exists rooms_code_uq on rooms (code);
create index if not exists rooms_expires_idx on rooms (expires_at);

-- 3. Segredos das salas (vidas reais, senha com hash scrypt, snapshot para desfazer)
create table if not exists room_secrets (
  room_id uuid primary key references rooms(id) on delete cascade,
  password_hash text,
  secret_state jsonb not null default '{}'::jsonb
);

-- 4. Row Level Security ativa em todas as tabelas (sem policies públicas -> somente service role acessa)
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table room_secrets enable row level security;

-- 5. Função de Compare-And-Swap atômico para concorrência segura
create or replace function cas_update_room(
  p_room_id uuid,
  p_expected_version integer,
  p_public_state jsonb,
  p_status text,
  p_secret_state jsonb
) returns boolean language plpgsql security definer as $$
declare rows_updated integer;
begin
  update rooms set
    public_state = p_public_state,
    status = p_status,
    version = p_expected_version + 1,
    updated_at = now(),
    expires_at = now() + interval '24 hours'
   where id = p_room_id and version = p_expected_version;

  get diagnostics rows_updated = row_count;
  if rows_updated = 0 then
    return false;
  end if;

  update room_secrets set
    secret_state = p_secret_state
   where room_id = p_room_id;

  return true;
end $$;

revoke all on function cas_update_room from public, anon, authenticated;
