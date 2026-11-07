# Arena FDP 🃏👑 — v1.0.0

Plataforma digital completa para gerenciar partidas do jogo físico **FDP** (variação dinâmica e cartoon de truco com vidas, eliminações e consenso).

> **"A partida só acaba quando sobra um."**  
> Produção: [https://fdp-dusky.vercel.app](https://fdp-dusky.vercel.app)

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js (App Router, Turbopack) + React 19
- **Linguagem:** TypeScript (estrito com `noUncheckedIndexedAccess`)
- **Estilização:** Tailwind CSS v4 + Design Tokens Cartoon
- **Animações & Efeitos:** Framer Motion (Toon Force) + Web Audio sintetizado puro
- **Gerenciamento de Estado:** Zustand
- **Validação & Contratos:** Zod
- **Backend & Tempo Real:** Supabase Realtime Broadcast + Next.js Route Handlers + Compare-and-Swap RPC (PostgreSQL)
- **Criptografia & Auth:** Scrypt (Node.js crypto nativo) + JWT HS256 (`jose`)
- **Testes & QA:** Vitest (126 testes unitários/propriedades) + Playwright (14 testes E2E, Axe-core WCAG 2.1 AA)

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

## 🌐 Configuração do Backend Online (Supabase & Vercel)

Para configurar o banco de dados e as variáveis no painel da Vercel para o modo multiplayer online, consulte o guia passo a passo em:
👉 **[INSTRUCOES-VERCEL-SUPABASE.md](./INSTRUCOES-VERCEL-SUPABASE.md)**

### Variáveis Necessárias (Vercel Production & Preview):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-secreta
ROOM_TOKEN_SECRET=gerado-com-openssl-rand-base64-32
```

> **Nota de Segurança de Produção**: Em ambiente de produção (`NODE_ENV=production`), se as variáveis do Supabase não estiverem configuradas, as rotas `/api/rooms*` e `/api/profile*` retornam `503 Service Unavailable` com corpo `{ error: "not_configured" }`, desabilitando o botão online e mantendo o modo Singleplayer offline funcionando sem riscos de dessincronização. Para habilitar repositórios em memória propositalmente em CI ou testes, utilize `FDP_ALLOW_MEMORY_REPO=1`.

---

## 🧪 Qualidade, Testes e Verificação

### 1. Verificação de Ambiente
```bash
# Verifica variáveis locais no .env
node scripts/verify-env.mjs

# Verifica integridade remota via endpoint de saúde
node scripts/verify-env.mjs https://fdp-dusky.vercel.app
```

### 2. Smoke Test de Produção (Não-destrutivo)
```bash
node scripts/smoke-prod.mjs https://fdp-dusky.vercel.app
```

### 3. Suíte de Testes Automatizados
```bash
# Checagem de Tipos TypeScript (0 erros)
npm run typecheck

# Testes Unitários, de Segurança e Baseados em Propriedades (Vitest)
npm run test

# Testes de Acessibilidade (WCAG 2.1 AA), E2E e Vazamento de Vida (Playwright)
npx playwright test --project="Desktop Chrome 1440"
```

---

## 📋 Changelog

Consulte o histórico detalhado de todas as alterações e correções da versão 1.0.0 em:
👉 **[CHANGELOG.md](./CHANGELOG.md)**
