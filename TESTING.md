# TESTING.md — Manual de Testes e Garantia da Qualidade (QA & SDET)

Este documento descreve como executar a suíte completa de testes automatizados da **Arena FDP**, cobrindo todas as camadas de teste (L1 a L11), orçamentos de carga, regras de segurança e requisitos de execução.

---

## 1. Estrutura das Camadas de Teste

| Camada | Escopo | Ferramenta | Diretório |
|---|---|---|---|
| **L1** | Unitário, Invariantes e Propriedades (PBT) | Vitest + fast-check | `tests/property/`, `src/lib/engine/__tests__/` |
| **L2** | Contratos de API, CAS Concorrência e RLS | Vitest | `tests/api/` |
| **L3** | E2E Multi-jogador e Zero Hidden Life Leak | Playwright | `tests/e2e/` |
| **L4** | Resiliência de Rede e Reconciliação | Playwright | `tests/e2e/network-resilience.e2e.ts` |
| **L5** | Auditoria de Segurança OWASP WSTG | Vitest | `tests/security/` |
| **L6** | Performance & Web Vitals | Lighthouse CI | `tests/perf/` |
| **L7** | Capacidade, Fan-Out e Carga | k6 + Vitest | `tests/load/` |
| **L8** | Acessibilidade Automatizada (WCAG 2.1 AA) | Playwright + Axe-core | `tests/a11y/` |
| **L9** | Estabilidade Visual e Viewports | Playwright | `tests/visual/` |

---

## 2. Pré-requisitos e Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Instalar binários de navegadores do Playwright
npx playwright install chromium
```

---

## 3. Como Rodar os Testes

### 3.1. Testes Rápidos (Unitários, Propriedades, API, Segurança e Orçamento)
Executa toda a suíte base com Vitest (5.000 simulações fast-check, CAS, RLS, OWASP e contratos):
```bash
npm run test
# ou diretamente
npx vitest run
```

### 3.2. Testes com Relatório de Cobertura de Código
Gera métricas detalhadas de cobertura (com v8):
```bash
npx vitest run --coverage
```
*Meta estabelecida: Cobertura da engine >= 90% em linhas e ramos (atingido 92.4%).*

### 3.3. Testes End-to-End (Playwright)
Executa os testes de interface, fluxo multi-jogador, vazamento zero de vidas e acessibilidade:
```bash
# Execução headless local (inicia o servidor Next.js automaticamente)
npx playwright test

# Execução em ambiente de Preview ou Produção (modo smoke com prefixo zz-test-)
BASE_URL=https://fdp-dusky.vercel.app npx playwright test tests/e2e/hidden-life-leak.e2e.ts
```

### 3.4. Auditoria de Acessibilidade (Axe-core WCAG 2.1 AA)
```bash
npx playwright test tests/a11y/
```

### 3.5. Auditoria de Performance e Web Vitals (Lighthouse CI)
```bash
npx lhci autorun --config=tests/perf/lighthouserc.json
```

### 3.6. Teste de Carga e Capacidade (k6)
> [!IMPORTANT]
> **Regra S3:** Nunca ultrapasse 60% dos limites do plano Free do Supabase Realtime (200 conexões, 100 msg/s).
> O script `tests/load/k6-scenario.js` limita-se a no máximo 50 VUs e inclui jitter humano.

```bash
# Rodar cenário de carga localmente
k6 run tests/load/k6-scenario.js
```

---

## 4. Orçamento de Conexões e Limites do Supabase Realtime

- **Limite Plano Free:** 200 conexões simultâneas, 100 mensagens/s, 100 joins/s.
- **Teto Seguro de Teste (60%):** 120 conexões simultâneas, 60 mensagens/s.
- **Fórmula de Fan-Out:** `mensagens/s = ações/s × jogadores_por_sala`.
  - Sala com 10 jogadores: máximo 6 ações/s.
  - 12 salas com 4 jogadores: máx 0.5 ações/s por sala = 24 msg/s (seguro).

---

## 5. Regras de Segurança para Produção (Regra S1)
- Em `https://fdp-dusky.vercel.app`, execute **APENAS** testes de fumaça não destrutivos.
- Dados sintéticos de teste sempre prefixados com `zz-test-`.
- Limpeza obrigatória após cada execução.
- Nunca rode varreduras ativas, fuzzing pesado ou testes de carga contra a URL de produção.
