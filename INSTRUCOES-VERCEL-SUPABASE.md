# 🚀 Instruções de Configuração: Supabase & Vercel (Produção & Preview)

Este documento descreve o passo a passo obrigatório para o proprietário do projeto configurar o banco de dados Supabase e as variáveis de ambiente na Vercel para a versão de produção do **Arena FDP**.

---

## 📋 Sumário das Variáveis Necessárias

| Nome da Variável | Onde obter | Ambiente | Sensível / Segredo? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API > Project URL | Production, Preview | Pública (vai para o cliente) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > Project API keys (`anon` / `public`) | Production, Preview | Pública (vai para o cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API > Project API keys (`service_role`) | Production, Preview | ⚠️ **SEGREDO CRÍTICO** (Nunca expor) |
| `ROOM_TOKEN_SECRET` | Gerado via terminal (OpenSSL) | Production, Preview | ⚠️ **SEGREDO CRÍTICO** (Nunca expor) |

---

## Passo 1: Executar a Migração no Supabase

1. Acesse o painel do seu projeto no [Supabase](https://supabase.com/dashboard).
2. No menu lateral esquerdo, clique em **SQL Editor**.
3. Abra o arquivo [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) deste repositório.
4. Copie todo o conteúdo do arquivo, cole no editor SQL do Supabase e clique em **Run**.
5. Verifique se as seguintes tabelas e funções foram criadas com sucesso:
   - Tabela `profiles` (com Row Level Security ativa)
   - Tabela `rooms` (com Row Level Security ativa)
   - Tabela `room_secrets` (com Row Level Security ativa)
   - Função RPC `cas_update_room`

> [!NOTE]
> As políticas de RLS garantem que a Anon Key pública não tem acesso direto a ler ou gravar vidas secretas ou salas; todas as operações autoritativas passam pelos Route Handlers na Vercel usando a Service Role.

---

## Passo 2: Obter as Chaves do Supabase

1. No Supabase, vá em **Project Settings** (ícone de engrenagem) > **API**.
2. Copie:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY` (clique em *Reveal*)

---

## Passo 3: Gerar o Segredo dos Tokens de Sala (`ROOM_TOKEN_SECRET`)

No seu terminal local (Linux, macOS, WSL ou Git Bash), execute:

```bash
openssl rand -base64 32
```

*(No PowerShell do Windows, você pode rodar: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`)*

Copie a string gerada (ela terá pelo menos 44 caracteres).

> [!WARNING]
> **Atenção:** Se você alterar o `ROOM_TOKEN_SECRET` no futuro, todos os tokens de salas e perfis existentes no ar serão invalidados (os usuários precisarão entrar novamente na sala). Isso é o comportamento esperado de segurança.

---

## Passo 4: Cadastrar as Variáveis na Vercel

1. Acesse o painel do seu projeto na [Vercel](https://vercel.com/dashboard).
2. Vá em **Settings** > **Environment Variables**.
3. Adicione as 4 variáveis para os ambientes **Production** e **Preview**:

### 1) `NEXT_PUBLIC_SUPABASE_URL`
- Valor: sua Project URL (ex: `https://xyzcompany.supabase.co`)
- Ambientes: `Production`, `Preview`

### 2) `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Valor: sua Anon Key
- Ambientes: `Production`, `Preview`

### 3) `SUPABASE_SERVICE_ROLE_KEY`
- Valor: sua Service Role Key
- Ambientes: `Production`, `Preview`
- Marque como **Sensitive** (para que não seja visível na interface após salva).

### 4) `ROOM_TOKEN_SECRET`
- Valor: a chave gerada no Passo 3
- Ambientes: `Production`, `Preview`
- Marque como **Sensitive**.

---

## Passo 5: Redeploy na Vercel

Após salvar as 4 variáveis:
1. Vá na aba **Deployments** na Vercel.
2. No último deployment da branch `main` (ou no Preview da sua branch), clique no menu de três pontos (...) e selecione **Redeploy**.
3. Aguarde o build e a publicação terminarem.

---

## Passo 6: Verificar a Saúde do Ambiente

No seu computador, execute o script de verificação contra a URL publicada:

```bash
node scripts/verify-env.mjs https://fdp-dusky.vercel.app
```

Você verá a tabela de status:
```text
=================================================================
  ARENA FDP - VERIFICAÇÃO DE AMBIENTE
=================================================================

Modo: Verificação Remota via https://fdp-dusky.vercel.app/api/health

Verificação                    | Status  | Detalhe
-----------------------------------------------------------------
Versão da Aplicação            | [ OK ]  | v1.0.0
Supabase Conectado             | [ OK ]  | URL e Service Role presentes
Realtime Anon Key              | [ OK ]  | Anon Key configurada
ROOM_TOKEN_SECRET              | [ OK ]  | Segredo válido (>= 32 chars)
Schema do Banco (SQL)          | [ OK ]  | Tabelas e cas_update_room ativas
-----------------------------------------------------------------

✔ Ambiente de produção 100% operacional!
```

---

## Passo 7: Teste de Fumaça Manual (Smoke Test)

1. Abra a URL em duas abas (ou em um computador e em um celular):
   - **Aba 1 (Host):** Clique em "CRIAR SALA" > modo Online > crie a sala.
   - **Aba 2 (Jogador):** Clique em "ENTRAR COM CÓDIGO", informe o código da sala e entre.
2. Na Aba 1, verifique que o jogador da Aba 2 apareceu instantaneamente no Lobby via Realtime.
3. Inicie a partida, reporte dano e veja a animação Toon de revelação acontecer em sincronia em ambas as telas!
