# PROGRESSO.md — Arena FDP

## Estado Atual
- **Versão:** 1.0.0
- **Status:** Release 1.0.0 Finalizada e Pronta para Produção
- **Build de Produção:** Next.js Turbopack OK (0 erros)
- **Suíte de Testes:**
  - Vitest: 16 arquivos de teste, 126 testes aprovados (100%), 5.000 simulações de partidas completas por property-based testing.
  - Playwright E2E: 14 testes E2E aprovados (100%), auditoria Axe-core WCAG 2.1 AA com 0 violações críticas/sérias, zero vazamento de vida oculta no DOM/storage/network/ws.

---

## Histórico de Fases

### Fases 1 a 8: Fundação, Engine, UI, Modos de Jogo, Telão e PWA
- Concluídas com sucesso (Design system toon, engine pura determinística, Toon FX, backend Supabase Realtime com CAS RPC, PWA offline e telas públicas de telão).

---

## Release 1.0.0 — QA Hardening e Fechamento

### Bloco P0: Infraestrutura e Segurança de Produção
- `P0.1`: Falha segura 503 com código `not_configured` nas rotas `/api/rooms*` e `/api/profile*` quando Supabase não estiver configurado em produção (flag `FDP_ALLOW_MEMORY_REPO=1` para CI/testes). Validação rigorosa de `ROOM_TOKEN_SECRET` (mínimo 32 caracteres e recusa do segredo padrão de dev). Tratamento amigável na UI.
- `P0.2`: Criação do endpoint `GET /api/health` retornando apenas `{ version, supabaseConfigured, realtimeConfigured, tokenSecretOk, schemaOk }` sem vazar segredos. Script `scripts/verify-env.mjs` para checagem local e remota.
- `P0.3`: Criação de `INSTRUCOES-VERCEL-SUPABASE.md` com instruções completas para o proprietário.

### Bloco P1: Bugs Funcionais Críticos
- `P1.1`: Rescrita do Service Worker (`arena-fdp-v2`) com bypass obrigatório para rotas de `/api/*`, `/sala/*` e domínios do Supabase Realtime. Cabeçalho `Cache-Control: no-cache, no-store, must-revalidate` para `/sw.js`.
- `P1.2`: Correção do batching atômico no modo Singleplayer (`dispatchBatch` sequencial com redução direta sobre o estado mais recente).
- `P1.3`: Painel individual de reporte online (`OnlineReportPanel`), com stepper apenas para o jogador corrente, confirmação visual dos demais participantes e modal de encerramento forçado para o host.
- `P1.4`: Projeção pública segura de `canUndo` sem expor snapshots prévios com vidas.
- `P1.5`: Validação estrita de mínimo 2 jogadores ativos participantes quando o host é espectador.
- `P1.6`: Eliminação total de canais laterais de adivinhação de vida oculta.

### Bloco P2: Funcionalidades Faltantes de UI
- `P2.1`: Modais de transferência de host e alteração de regras no `LobbyView`.
- `P2.2`: Botão de ressincronização manual do estado da sala no cabeçalho de `/sala/[code]`.
- `P2.3`: Barra de consenso (`ProposalBar`) na fase `reveal` com `isHost={true}` no modo Singleplayer.
- `P2.4`: Tabela de resumo final da partida (`MatchSummaryTable`) com revelação das vidas reais.
- `P2.5`: Atalho para retomar partida local recente na Home e tela de criação.

### Bloco P3: Acessibilidade e Performance (WCAG 2.1 AA)
- `P3.1`: Viewport livre de bloqueio de zoom (`BUG-01`), otimização de imagens com `sizes` e `priority`.
- `P3.2`: Hook e store global `useReducedMotion` respeitando `arena_fdp_reduced_motion` e `prefers-reduced-motion`. Região de anúncios de tela acessível com `aria-live="polite"` (`AriaLiveAnnouncer`) para voz/leitores de tela. Correção de contrastes nos tokens globais e componentes.
- `P3.3`: Suíte completa Playwright E2E em Chromium cobrindo fluxo multiplayer, reconexão de rede, telão e auditoria Axe-core sem violações.

### Bloco P4: Entrega da Versão 1.0.0
- `P4.1`: Auditoria pós-correção e geração do `RELATORIO-FINAL.md`.
- `P4.2`: Versionamento `1.0.0` no `package.json`, `CHANGELOG.md` e `README.md`.
- `P4.3`: Script automatizado de smoke test não-destrutivo `scripts/smoke-prod.mjs`.
