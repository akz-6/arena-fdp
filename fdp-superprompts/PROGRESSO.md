# PROGRESSO.md (o agente atualiza ao fim de cada fase)

## Estado atual
- Fase concluída: 2
- Próxima fase: 3

## Registro por fase
### Fase 1
- Feito:
  - Inicialização do projeto Next.js (App Router), TypeScript estrito (`strict: true`, `noUncheckedIndexedAccess: true`), Tailwind CSS e ESLint.
  - Dependências instaladas: `framer-motion`, `zustand`, `zod`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`.
  - Design Tokens e estilos globais configurados em `src/styles/tokens.css` e `src/app/globals.css` integrando as cores oficiais do Design System Arena FDP (branco predominante, preto #111111, azul #35B8F4, vermelho #FF3038, amarelo #FFC233, 12 cores de jogadores, bordas 2-4px, sombras duras, halftone suave).
  - Tipografia configurada via `next/font/google`: Fredoka (títulos), Nunito Sans (corpo) e Bangers (onomatopeias e elementos de jogo).
  - Componentes base em `src/components/ui`: `ToonButton`, `ToonCard`, `ToonInput`, `Badge`, `ColorPicker`, `Stepper`, `Switch`, `Segmented`, `Sheet`, `Toast` (com `ToastProvider` e hook `useToast`).
  - Componentes toon em `src/components/toon`: `Mascot` (blob original piscando/respirando), `SpeechBubble`, `Burst` (POW, BANG), `Avatar` (suporte a 12 cores, coroa de host, selo de vida e estados idle/hit/dead/win/away).
  - Layout mobile-first com `Header` exibindo a logo oficial da Arena FDP (`/logo.png`), botões de navegação, e páginas `/`, `/perfil`, `/criar`, `/regras`.
  - Home completa com Hero cartoon, cartas flutuantes, mascote interativo e Sheet funcional para entrada com código de sala.
  - Vitrine interna em `/_dev/ui` (com `notFound()` em produção).
  - Testes unitários com Vitest e React Testing Library para `ToonButton` e `Stepper`.
  - Validações: `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build` passando com 0 erros.
- Desvios da planta:
  - Incorporação detalhada dos parâmetros visuais do superprompt XML específico da Arena FDP e uso da logo oficial preservada em alta fidelidade.
- Pendências:
  - Nenhuma.

### Fase 2
- Feito:
  - Implementação completa da engine pura em `src/lib/engine`:
    - `types.ts`: Schemas Zod e tipos estritos para GameConfig, Player, GameState, GameAction, GameEvent, Reveal, Proposal.
    - `cards.ts`: Tabela hierárquica do FDP/truco (4 de Paus/Zap no topo, 4s comuns na base, 7 de Paus/Espadas empatados).
    - `rng.ts`: PRNG determinístico Mulberry32, helpers `randomInt`, `pick`, `shuffle` (zero I/O).
    - `life.ts`: Sorteio determinístico de vidas (fixa, aleatória compartilhada ou individual).
    - `rounds.ts`: Baralhos extras automáticos, teto dinâmico de cartas `floor(40 * decks / vivos)`, algoritmo de sequência de cartas (sobe até o teto, desce até 1, volta a subir sem repetir o 1), dealer rotativo.
    - `names.ts`: Gerador de apelidos cartoon com unicidade de nomes e seleção de cores livres da paleta.
    - `project.ts`: Projeção segura `projectPublic` garantindo que o campo `life` nunca vaze em modo `hidden`.
    - `reducer.ts`: Máquina de estados pura com suporte a ADD_PLAYER, KICK, LEAVE, SET_AWAY, START, END_ROUND, SET_DAMAGE, CONFIRM, FORCE_CLOSE, NEXT_ROUND, PROPOSE_ADJUST, VOTE (consenso unânime), HOST_ADJUST (cura e dano letal), TRANSFER_HOST, UNDO_LAST_ROUND e REMATCH.
    - `index.ts`: Barrel exportando a API pública da engine.
  - 37 testes unitários e de propriedades no Vitest cobrindo todas as regras, vazamento de vida oculta e simulação Monte Carlo de 500 partidas completas.
  - Cobertura de testes na engine: >91% de linhas e statements.
  - Zero uso de `Date.now()` ou `Math.random()` na engine.
  - Linters, typecheck e build 100% limpos.
- Desvios da planta:
  - Nenhum. Todas as correções C3, C4, C5, C7, C8, C9, C11, C14 foram implementadas e verificadas.
- Pendências:
  - Nenhuma. Pronto para a Fase 3 (Toon FX).

### Fase 3
- Feito:
- Desvios da planta:
- Pendências:

(repetir até a Fase 8)

## Decisões tomadas pelo agente
- 
