# FASE 5 — Backend (Supabase + Route Handlers)

Leia primeiro: `AGENTS.md`, `01-PLANTA.md` (seções 4, 6, 7, 10).

```xml
<superprompt phase="5" name="Backend Supabase e API">
  <role>
    Engenheiro de backend sênior com doutorado, especialista em sistemas distribuídos serverless, segurança e Postgres.
  </role>

  <context>
    O online roda na Vercel (serverless). Não há WebSocket próprio: o tempo real é Supabase Realtime Broadcast.
    O servidor é a única autoridade: carrega estado, executa a engine, grava com compare-and-swap e publica o estado público projetado.
  </context>

  <read_first>
    <file>AGENTS.md</file>
    <file>01-PLANTA.md</file>
  </read_first>

  <objective>
    Banco, camada de acesso, autenticação por token, rotas de API e broadcast, totalmente testados, sem UI online ainda.
  </objective>

  <constraints>
    <item>Instalar: @supabase/supabase-js, jose. Usar apenas crypto nativo do Node para scrypt.</item>
    <item>Route Handlers com export const runtime = "nodejs" e export const dynamic = "force-dynamic".</item>
    <item>SUPABASE_SERVICE_ROLE_KEY e ROOM_TOKEN_SECRET somente no servidor (arquivo src/lib/server com import "server-only").</item>
    <item>RLS ligada em todas as tabelas, SEM policies para anon/authenticated (acesso só via service role).</item>
    <item>Nunca incluir vidas ocultas, hashes ou tokens em respostas/broadcast.</item>
    <item>Criar .env.example com todas as variáveis; nunca commitar segredos.</item>
  </constraints>

  <tasks>
    <task id="5.1" title="Migração SQL (supabase/migrations/0001_init.sql)">
      <sql><![CDATA[
create extension if not exists pgcrypto;

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

create table if not exists room_secrets (
  room_id uuid primary key references rooms(id) on delete cascade,
  password_hash text,
  secret_state jsonb not null default '{}'::jsonb
);

alter table profiles enable row level security;
alter table rooms enable row level security;
alter table room_secrets enable row level security;
-- Sem policies: apenas a service role (servidor) acessa.

create or replace function cas_update_room(
  p_room_id uuid, p_expected_version integer,
  p_public_state jsonb, p_status text, p_secret_state jsonb
) returns boolean language plpgsql security definer as $$
declare rows_updated integer;
begin
  update rooms set public_state = p_public_state, status = p_status,
         version = p_expected_version + 1, updated_at = now(),
         expires_at = now() + interval '24 hours'
   where id = p_room_id and version = p_expected_version;
  get diagnostics rows_updated = row_count;
  if rows_updated = 0 then return false; end if;
  update room_secrets set secret_state = p_secret_state where room_id = p_room_id;
  return true;
end $$;
revoke all on function cas_update_room from public, anon, authenticated;
      ]]></sql>
      Documentar no README como aplicar (SQL Editor do Supabase ou supabase db push).
    </task>
    <task id="5.2" title="Camada server (src/lib/server)">
      supabase.ts (cliente service role, singleton), hash.ts (scrypt com salt, verify em tempo constante, também para device secret e recovery code),
      auth.ts (assinar/verificar token HS256 com jose, expiração 24h, payload roomId/playerId; token de perfil separado),
      rooms-repo.ts (createRoom, getRoomByCode, loadFull(code) -> state completo = public_state + secret_state, saveWithCas via RPC cas_update_room com retry até 3x),
      broadcast.ts (publicar no canal "room:{code}" via REST do Supabase Realtime o evento "state" com projectPublic(state) e version),
      rate-limit.ts (janela em memória por IP+rota; documentar que é best-effort em serverless),
      code.ts (gerar código de sala de 6 caracteres sem I, O, 0, 1; tentar de novo em colisão),
      cleanup: ao criar sala, apagar salas expiradas (delete where expires_at < now()).
    </task>
    <task id="5.3" title="Rotas de perfil">
      POST /api/profile: valida Zod, cria perfil com nome único case-insensitive; 409 se existir. Retorna { profileId, deviceToken, recoveryCode } (recoveryCode mostrado apenas aqui, formato legível ex.: XXXX-XXXX).
      POST /api/profile/recover: recebe nome + recoveryCode, gera novo deviceToken.
      GET /api/profile/check?name=: retorna { available }.
      PATCH /api/profile: altera nome/cor autenticado pelo deviceToken (mantendo unicidade).
    </task>
    <task id="5.4" title="Rotas de sala">
      POST /api/rooms: cria sala a partir de GameConfig + senha opcional + perfil opcional (nome/cor ou vazio = aleatório único). Retorna { code, token, playerId }.
      POST /api/rooms/[code]/join: valida senha (429 após tentativas excessivas), aplica ADD_PLAYER da engine (nome/cor vazios -> aleatórios únicos checando salas e perfis), retorna token. Após START entra como espectador.
      GET /api/rooms/[code]/state: snapshot público projetado; sem token retorna dados mínimos de lobby (nome da sala, se tem senha, quantos jogadores) e exige senha/token para o resto.
      POST /api/rooms/[code]/action: valida token, valida action com Zod, roda reduce(), salva com CAS, publica broadcast, retorna estado público. Erros tipados (403 permissão, 409 conflito após retries, 422 regra violada).
    </task>
    <task id="5.5" title="Contratos compartilhados">
      src/lib/contracts.ts com schemas Zod de request/response e tipos de erro, usados por servidor e cliente.
    </task>
    <task id="5.6" title="Testes">
      Testes de unidade (Vitest) para hash, tokens, code, rate-limit.
      Testes de rotas com Supabase mockado (repositório em memória implementando a mesma interface de rooms-repo): fluxo criar -> entrar -> iniciar -> reportar -> revelar.
      Teste de segurança: respostas e payloads de broadcast em modo hidden não contêm "life", "password", "hash" nem "secret".
      Teste de CAS: duas ações concorrentes na mesma versão -> uma retenta e ambas aplicam sem perder dados.
    </task>
    <task id="5.7" title="Documentação de ambiente">
      README seção Online: criar projeto Supabase, aplicar migração, variáveis NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ROOM_TOKEN_SECRET (gerar com openssl rand -base64 32).
      Habilitar Realtime Broadcast (sem tabelas expostas).
    </task>
  </tasks>

  <acceptance_criteria>
    <item>lint, typecheck, test e build passam sem precisar de credenciais reais (testes usam repo em memória).</item>
    <item>Nenhum segredo em NEXT_PUBLIC_*; arquivos de src/lib/server importam "server-only".</item>
    <item>Teste de vazamento e teste de CAS passam.</item>
    <item>Todas as rotas validam entrada e retornam erros tipados.</item>
  </acceptance_criteria>

  <self_review>
    Reabrir 01-PLANTA.md seções 4, 6, 7 e 10. Conferir C1, C2, C6, C15 e que cada rota da tabela da seção 7 existe.
  </self_review>

  <handoff>
    Atualizar PROGRESSO.md com contratos, variáveis de ambiente e instruções para testar com um projeto Supabase real.
  </handoff>
</superprompt>
```
