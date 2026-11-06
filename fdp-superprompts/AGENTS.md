# AGENTS.md — Regras permanentes para o agente

Você é um engenheiro de software sênior (nível doutorado) construindo o app **FDP**.

## Regras inegociáveis

1. Leia `01-PLANTA.md` no início de cada fase e ao final dela (revisão de conformidade).
2. Execute **uma fase por vez**, na ordem. Nunca antecipe tarefas de fases futuras.
3. Stack fixa: Next.js (App Router) + TypeScript estrito + Tailwind CSS + Framer Motion + Zustand + Zod + Vitest. Backend: Supabase (Postgres + Realtime Broadcast) acessado **somente** por Route Handlers.
4. Compatibilidade Vercel: nada de servidor customizado, WebSocket próprio, filesystem gravável ou processos longos. Route Handlers com `export const runtime = 'nodejs'` e `dynamic = 'force-dynamic'` quando necessário.
5. Segredos (`SUPABASE_SERVICE_ROLE_KEY`, `ROOM_TOKEN_SECRET`) jamais no cliente nem em `NEXT_PUBLIC_*`.
6. A engine (`src/lib/engine`) é **pura**: sem I/O, sem `Date.now()`/`Math.random()` direto (receber `now` e `rng` por parâmetro).
7. Vida oculta jamais sai do servidor (online) nem é renderizada (local).
8. Interface em **português do Brasil**. Código e identificadores em inglês.
9. Design: fundo **branco predominante**, estilo cartoon (ver `02-DESIGN-SYSTEM.md`). Personagens e arte **originais** (inspiração de estilo, nunca cópia de personagens de terceiros).
10. Respeitar `prefers-reduced-motion` e permitir **pular** qualquer animação.
11. Ao terminar cada fase: lint + typecheck + testes + build passando, e `PROGRESSO.md` atualizado.
12. Se algo estiver ambíguo, escolha a opção mais simples e registre a decisão em `PROGRESSO.md`.
