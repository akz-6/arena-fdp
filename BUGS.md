# BUGS.md — Registro de Bugs e Vulnerabilidades

Este arquivo documenta todos os problemas encontrados durante a auditoria e hardening de QA da Arena FDP, contendo ID, severidade, passos para reprodução, comportamento esperado vs obtido, evidências e resolução.

---

## Tabela de Severidades

| Nível | Descrição | Bloqueante para Release? |
|---|---|---|
| **S0** | Crítico: Vazamento de vida oculta, segredos/chaves expostos, perda ou corrupção de estado, queda de produção | **SIM** |
| **S1** | Alto: Fluxo principal quebrado (não consegue criar/jogar/finalizar sala) sem contorno | **SIM** |
| **S2** | Médio: Falha de acessibilidade WCAG, performance degradada, erro com contorno | Não (com plano) |
| **S3** | Baixo: Ajuste cosmético, texto, espaçamento visual | Não |

---

## Registro de Ocorrências

### [BUG-01] Violação de Acessibilidade WCAG 1.4.4 no Meta Viewport
- **Severidade:** S2
- **Camada:** L8 (Acessibilidade)
- **Origem:** Observação K1 da auditoria inicial
- **Localização:** `src/app/layout.tsx`
- **Passos para reproduzir:**
  1. Acessar a aplicação em dispositivo móvel ou emulador.
  2. Tentar efetuar o gesto de pinch-to-zoom (ampliação de tela).
- **Comportamento Obtido:** O zoom é completamente bloqueado pelo navegador devido a `maximumScale: 1` e `userScalable: false`.
- **Comportamento Esperado:** Usuários com deficiência visual devem conseguir ampliar a página até no mínimo 200% sem perda de conteúdo.
- **Resolução:** Remover `maximumScale: 1` e `userScalable: false` do objeto `viewport` em `src/app/layout.tsx`, mantendo apenas `initialScale: 1` e `width: 'device-width'`.
- **Status:** [x] Corrigido em `qa/hardening` (commit pendente)

---

### [BUG-02] Imagem do Logotipo no Header sem Atributo `sizes` (Requisições 3840w no Mobile)
- **Severidade:** S2
- **Camada:** L6 (Performance)
- **Origem:** Observação K2 da auditoria inicial
- **Localização:** `src/components/layout/Header.tsx`
- **Passos para reproduzir:**
  1. Abrir a Home em dispositivo móvel com alta densidade de pixels (ex: iPhone 14 Pro, Pixel 7).
  2. Inspecionar a aba Rede do DevTools filtrando por Imagens.
- **Comportamento Obtido:** O componente `<Image fill ... />` sem o atributo `sizes` faz com que o Next.js assuma `sizes="100vw"`, gerando requisição de `/logo.png?w=3840` para um container de apenas 44px (11x11 Tailwind).
- **Comportamento Esperado:** A imagem deve solicitar apenas o tamanho adequado para renderização (ex: `sizes="44px"` ou largura/altura fixas), economizando banda e melhorando o LCP.
- **Resolução:** Adicionar `sizes="44px"` no componente `Image` em `src/components/layout/Header.tsx`.
- **Status:** [x] Corrigido em `qa/hardening` (commit pendente)

---

### [BUG-03] Falta de Validação Estrita de Danos na Engine (`SET_DAMAGE`)
- **Severidade:** S1
- **Camada:** L1 (Engine) / L5 (Segurança & Validação)
- **Origem:** Teste de propriedades L1 (PBT com fast-check)
- **Localização:** `src/lib/engine/reducer.ts`
- **Passos para reproduzir:**
  1. Durante a fase de reporte, disparar ação `SET_DAMAGE` com valores inválidos (ex: `-1`, `1.5`, `NaN` ou `Infinity`).
- **Comportamento Obtido:** A engine aplicava `Math.max(0, Math.floor(damage))`, mascarando o input inválido em vez de rejeitá-lo com erro explícito.
- **Comportamento Esperado:** Inputs inválidos, decimais, negativos, infinitos ou NaN devem ser estritamente rejeitados com `Error('Dano deve ser um número inteiro maior ou igual a zero')`.
- **Resolução:** Adicionada validação com `typeof action.damage !== 'number' || !Number.isFinite(action.damage) || !Number.isInteger(action.damage) || action.damage < 0` em `src/lib/engine/reducer.ts`.
- **Status:** [x] Corrigido em `qa/hardening` (commit pendente)

---

### [BUG-04] `generateRandomName` Gera Nomes com Mais de 16 Caracteres Causando Erro 422 em `/join`
- **Severidade:** S1
- **Camada:** L1 (Engine) / L2 (API)
- **Origem:** Teste de contrato L2 (`tests/api/api-contracts.test.ts`)
- **Localização:** `src/lib/engine/names.ts`
- **Passos para reproduzir:**
  1. Entrar em uma sala sem fornecer nome ou com nome colidindo, ativando `generateRandomName`.
  2. Quando sortear substantivos e adjetivos longos (ex: "Dinossauro" + "Saltitante" = 21 chars), a engine em `ADD_PLAYER` rejeita com `Error('O nome deve ter entre 2 e 16 caracteres')`, retornando HTTP 422.
- **Comportamento Obtido:** Jogador recebia erro 422 aleatório ao tentar ingressar na sala.
- **Comportamento Esperado:** Nomes gerados automaticamente devem respeitar estritamente o limite de 2 a 16 caracteres exigido pelo schema e pela engine.
- **Resolução:** Adicionar verificação `candidate.length <= 16` no gerador de nomes aleatórios em `src/lib/engine/names.ts`.
- **Status:** [x] Corrigido em `qa/hardening` (commit pendente)

---

### [BUG-05] Ausência de Cabeçalhos HSTS e CSP no `next.config.ts`
- **Severidade:** S2
- **Camada:** L5 (Segurança de Aplicação)
- **Origem:** Auditoria OWASP WSTG
- **Localização:** `next.config.ts`
- **Passos para reproduzir:**
  1. Inspecionar cabeçalhos de resposta HTTP da aplicação.
- **Comportamento Obtido:** Cabeçalhos `Strict-Transport-Security` e `Content-Security-Policy` não eram enviados pelo servidor Next.js.
- **Comportamento Esperado:** Envio de `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` e `Content-Security-Policy` robusta prevenindo ataques de Clickjacking, XSS e downgrade HTTP.
- **Resolução:** Configurados os headers `Strict-Transport-Security` e `Content-Security-Policy` no array de cabeçalhos de `next.config.ts`.
- **Status:** [x] Corrigido em `qa/hardening` (commit pendente)

---
