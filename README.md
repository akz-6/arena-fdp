# Arena FDP 🃏👑

Plataforma digital para gerenciar partidas do jogo físico **FDP** (variação dinâmica e cartoon de truco com vidas e eliminações).

> **"A partida só acaba quando sobra um."**

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js (App Router) + React 19
- **Linguagem:** TypeScript (estrito com `noUncheckedIndexedAccess`)
- **Estilização:** Tailwind CSS v4 + Design Tokens Cartoon
- **Animações:** Framer Motion (Toon Force)
- **Gerenciamento de Estado:** Zustand
- **Validação:** Zod
- **Backend & Tempo Real:** Supabase Realtime Broadcast + Route Handlers (Node.js) + CAS RPC
- **Criptografia & Auth:** Scrypt (Node crypto nativo) + JWT HS256 (`jose`)
- **Testes:** Vitest + React Testing Library

---

## 🚀 Como Executar Localmente

### 1. Instalar dependências
```bash
npm install
```

### 2. Rodar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000`.

### 3. Vitrines Internas de Desenvolvimento (Apenas em `npm run dev`)
- **UI & Componentes Toon:** `http://localhost:3000/_dev/ui`
- **Catálogo de Efeitos (9 Golpes + 6 Mortes):** `http://localhost:3000/_dev/fx`

---

## 🌐 Configuração do Backend Online (Supabase)

Para ativar o modo multiplayer online em tempo real:

### 1. Criar projeto no Supabase
1. Crie uma conta ou acesse [Supabase](https://supabase.com).
2. Crie um novo projeto Postgres.
3. No painel do projeto, abra o **SQL Editor**.
4. Copie o conteúdo de `supabase/migrations/0001_init.sql` e execute.
   - Isso criará as tabelas `profiles`, `rooms`, `room_secrets`, ativará o **Row Level Security (RLS)** e instalará a função de concorrência atômica `cas_update_room`.
5. Em **Database -> Replication / Realtime**, confirme que o **Realtime Broadcast** está ativo (não há necessidade de replicar tabelas públicas, pois a comunicação utiliza canais efêmeros de broadcast autorizados).

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env.local` na raiz baseado no `.env.example`:

```bash
# Supabase público
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key

# Supabase Service Role (NUNCA expor no cliente)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-secreta

# Segredo de assinatura de tokens de sala e perfil (HS256)
ROOM_TOKEN_SECRET=gerar-com-openssl-rand-base64-32
```

Para gerar o `ROOM_TOKEN_SECRET`:
```bash
openssl rand -base64 32
```

*(Nota: Quando as variáveis do Supabase não estão configuradas, o sistema utiliza automaticamente repositórios em memória para testes e desenvolvimento offline).*

---

## 🧪 Qualidade e Testes

- **Typecheck:** `npm run typecheck`
- **Lint:** `npm run lint`
- **Testes Unitários e de Integração:** `npm run test`
- **Build de Produção:** `npm run build`
