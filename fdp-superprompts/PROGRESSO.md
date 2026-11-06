# PROGRESSO.md (o agente atualiza ao fim de cada fase)

## Estado atual
- Fase concluída: 4
- Próxima fase: 5

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
  - Implementação completa da biblioteca de efeitos e animações Toon Force em `src/components/fx`:
    - Utilitários:
      - `ScreenShake`: Contexto e hook `useShake()` com suporte a intensidade (`light`, `medium`, `heavy`) e respeito automático a `prefers-reduced-motion`.
      - `toonAudio`: Módulo WebAudio puro sintetizando sons retrô/cartoon (`playBonk`, `playExplosion`, `playSlideDown`, `playVictory`) com persistência em localStorage e mutado por padrão.
    - Catálogo dos 9 Golpes Cartoon (`src/components/fx/hit/`):
      1. `GunShot`: Tiro cartoon com bandeirinha BANG!, onomatopeia e tela tremendo.
      2. `RubberKnife`: Faca de borracha dobrando ao bater com efeito "PLIN!".
      3. `ElasticPunch`: Braço elástico estilo borracha/Gear 5 com murro "POW!" e squash.
      4. `Anvil`: Bigorna cartoon de 100KG caindo e achatando o avatar com "CLANG!".
      5. `PieFace`: Torta de chantilly voando e explodindo na cara com "SPLAT!".
      6. `BonkHammer`: Marreta de madeira "BONK!" com estrelinhas girando na cabeça.
      7. `Dynamite`: Dinamite TNT com pavio que explode em "BOOM!" deixando o rosto chamuscado.
      8. `FryingPan`: Frigideira de ferro com impacto metálico "PANG!".
      9. `FallingPiano`: Piano de cauda caindo do céu com teclas voando e som de quebra.
    - Catálogo das 6 Mortes Cartoon (`src/components/fx/death/`):
      1. `GhostAscend`: Fantasminha translúcido com auréola e harpa subindo aos céus.
      2. `PancakeCrumble`: Personagem achatado em panqueca que desmonta em pedaços.
      3. `HoleFall`: Buraco cartoon abrindo no chão e personagem caindo com pop.
      4. `SpiralSpin`: Giro em espiral hipnótico encolhendo até sumir em fumaça.
      5. `Tombstone`: Lápide de pedra R.I.P. caindo com nuvem de poeira e florzinha.
      6. `IrisOutDeath`: Diafragma de íris circular clássico de cinema se fechando em "FIM!".
    - Vitória e Empate (`VictoryFx.tsx`):
      - Coroa gigante animada, chuva de confetes SVG inline e avatar saltando em comemoração.
      - Variante empate: "EMPATE! TODOS CAÍRAM JUNTOS!" com todos os avatares vencedores.
    - Diretor de Efeitos (`FxDirector.tsx`):
      - Orquestração determinística da fila de revelação sincronizada via seed (`Reveal`).
      - Controles de "Próximo Golpe" e "Pular Tudo".
      - Suporte a modo telão e ocultação de dano numérico em vidas ocultas.
    - Vitrine de Efeitos (`/_dev/fx`):
      - Rota interna de desenvolvimento listando todos os 9 golpes, 6 mortes, vitória, empate e simulação completa de fila.
  - 48 testes unitários e de integração no Vitest cobrindo todos os efeitos, renderização, controle de timers e áudio sintetizado.
  - Linters, typecheck e build 100% limpos.
- Desvios da planta:
  - Nenhum. Todos os 9 golpes e 6 mortes do catálogo foram entregues e validados.
- Pendências:
  - Nenhuma. Pronto para a Fase 4 (Perfil e Singleplayer Offline).

### Fase 4
- Feito:
  - Sistema de Perfil Local (`src/lib/client/profile-store.ts`):
    - Persistência em `localStorage` de `id`, `name`, `color` e estatísticas (`totalMatches`, `victories`).
    - Geração automática de apelido cartoon e cor livre ao carregar se não existir.
    - Página `/perfil` (`src/app/perfil/page.tsx`) com edição reativa, troca de cor via `ColorPicker`, prévia animada do avatar toon e reset de perfil.
  - Gerenciador de Partidas Locais (`src/lib/client/local-game-store.ts`):
    - Store Zustand com persistência em `localStorage` gerenciando lista de partidas offline salvas.
    - Suporte a criar, carregar, atualizar e deletar partidas locais.
  - Criação de Partida Offline e Configurações (`src/app/criar/page.tsx`):
    - Formulário completo toon force: alternância entre Modo Presencial / Offline e Modo Online (com badge de indicação).
    - Configurações da arena: vidas (fixas 1-15, aleatórias compartilhadas ou individuais), visibilidade (pública ou oculta), modo organizador (jogador ou observador).
    - Roster de jogadores com adição e remoção dinâmica (2 a 12 jogadores), seleção de cor exclusiva e nomeação customizada.
  - Tela de Partida Offline / Mesa Presencial (`src/app/local/[id]/`):
    - Ciclo completo de partida local:
      1. Lobby local com lista de participantes e botão de início.
      2. Cabeçalho de rodada (`RoundHeader`): número da rodada, cartas por jogador com indicador de subida/descida do teto, baralhos em jogo e dealer destacado.
      3. Grid de jogadores (`PlayerGrid`): avatares toon com status, vidas e coroa de host.
      4. Painel de reporte e apuração de rodada (`ReportPanel`): seleção de vidas perdidas por jogador com validação de empate e botões de incremento/decremento.
      5. Revelação Toon (`FxDirector`): animações de golpes e mortes sincronizadas.
      6. Propostas e ajustes (`ProposalBar`): ajuste de vidas pelo host com histórico e suporte a desfazer rodada (`UNDO_LAST_ROUND`).
      7. Fim de jogo e tela de vitória com opções de revanche (`REMATCH`) e voltar para a lista de partidas.
    - Suporte a Wake Lock API (evita que a tela do celular apague durante a mesa) e Fullscreen Mode.
  - Página de Histórico Local (`src/app/local/page.tsx`):
    - Listagem com cards de partidas em andamento e finalizadas, retomada com um clique e exclusão.
  - Guia Interativo de Regras (`src/app/regras/page.tsx`):
    - Explicação das regras do jogo FDP, hierarquia completa das manilhas e cartas comuns (Zap até o 4).
  - PWA Offline First:
    - Service Worker (`public/sw.js`) com cache de assets estáticos e páginas offline.
    - Componente de registro (`ServiceWorkerRegister.tsx`) injetado no layout raiz.
  - 53 testes passando (4 novos testes de integração de perfil e singleplayer em `src/app/local/__tests__/singleplayer.test.tsx`).
  - Linters, typecheck e build de produção 100% limpos.
- Desvios da planta:
  - Nenhum.
- Pendências:
  - Nenhuma. Pronto para a Fase 5 (Backend Supabase e API).

### Fase 5

## Decisões tomadas pelo agente
- 
