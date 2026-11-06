# PROGRESSO.md (o agente atualiza ao fim de cada fase)

## Estado atual
- Fase concluída: 7
- Próxima fase: 8

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
- Feito:
  - Dependências de backend e segurança instaladas: `@supabase/supabase-js`, `jose`, `server-only`.
  - Migração SQL do Supabase (`supabase/migrations/0001_init.sql`):
    - Tabelas `profiles`, `rooms`, `room_secrets`.
    - RLS ativado em todas as tabelas (sem políticas públicas, acesso exclusivo via service role).
    - Função PL/pgSQL atômica `cas_update_room` com verificação de versão (Compare-And-Swap) e atualização coordenada de estado público e segredos.
  - Camada de Servidor Segura (`src/lib/server/`):
    - `hash.ts`: Criptografia com `scrypt` e salt aleatório, comparação em tempo constante via `timingSafeEqual`, geração de código de recuperação legível (`XXXX-XXXX`) e hash SHA-256 para segredos de dispositivo.
    - `code.ts`: Gerador de códigos de sala cartoon de 6 caracteres excluindo caracteres ambíguos (`0, 1, I, O`).
    - `auth.ts`: Assinatura e verificação de JWTs HS256 (`jose`) para tokens de sala (24h) e perfil (180 dias) com isolamento `server-only`.
    - `rate-limit.ts`: Limitador de taxa em memória por IP e rota (best-effort serverless).
    - `supabase.ts`: Singleton administrativo com Service Role Key (blindado contra vazamento no cliente).
    - `broadcast.ts`: Emissão de eventos em tempo real no canal `room:{code}` sanitizado via `projectPublic` (nunca vaza vidas ocultas).
    - `rooms-repo.ts`: Interface unificada `IRoomsRepository` com implementação em memória (`MemoryRoomsRepository`) para testes e Supabase (`SupabaseRoomsRepository`) com retry de CAS até 3x e expiração automática de 24h.
    - `profile-repo.ts`: Interface e repositório de perfis globais com garantia de unicidade de nome case-insensitive e suporte a recuperação.
  - Contratos e Schemas Compartilhados (`src/lib/contracts.ts`):
    - Schemas Zod de criação/recuperação/verificação de perfil.
    - Schemas Zod de criação de sala, entrada e discriminated union para todas as ações do jogo (`GameActionSchema`).
    - Tipos de erro e respostas estruturadas.
  - Route Handlers Next.js App Router (100% testados):
    - `POST /api/profile`: Criação de perfil global com nome único e código de recuperação.
    - `PATCH /api/profile`: Atualização de nome e cor autenticado por token de dispositivo.
    - `POST /api/profile/recover`: Recuperação de perfil via código.
    - `GET /api/profile/check?name=`: Verificação de disponibilidade de apelido.
    - `POST /api/rooms`: Criação de sala pelo host com configuração, senha opcional e geração de token.
    - `POST /api/rooms/[code]/join`: Entrada de jogador com validação de senha, rate limit contra brute force e atribuição de papel (espectador se partida em andamento).
    - `GET /api/rooms/[code]/state`: Consulta de estado (snapshot público completo com token; resumo mínimo sem token).
    - `POST /api/rooms/[code]/action`: Execução de ações com validação de token, autorização de ator, reduce puro, CAS com retry e broadcast.
  - Testes:
    - 67 testes no Vitest passando (14 novos testes de backend e segurança em `src/lib/server/__tests__/backend.test.ts`).
    - Teste de segurança: verificação estrita de que vidas ocultas, senhas, hashes ou segredos nunca estão presentes no payload público ou broadcast.
    - Teste de concorrência: validação do compare-and-swap evitando perdas em ações concorrentes.
  - Documentação e Ambiente:
    - `.env.example` criado com todas as variáveis documentadas.
    - `README.md` atualizado com o passo a passo completo para configuração do Supabase, execução da migração e geração de segredos.
  - Linters, typecheck e build de produção 100% limpos.
- Desvios da planta:
  - Nenhum.
- Pendências:
  - Nenhuma. Pronto para a Fase 6 (Lobby Online e Conexão em Tempo Real).

### Fase 6
- Feito:
  - Perfil Global Aprimorado (`src/app/perfil/page.tsx`):
    - Checagem em tempo real de disponibilidade de apelido via debounce (`/api/profile/check`).
    - Registro de perfil global via `POST /api/profile` com armazenamento do `deviceToken`.
    - Modal de exibição única do Código de Recuperação (`XXXX-XXXX`) com botão de cópia e aviso claro.
    - Tela de recuperação de perfil com apelido + código restaurando acesso e token no aparelho.
    - Edição de apelido e cor via `PATCH /api/profile` mantendo garantia de unicidade (erro 409 com mensagem amigável: "Esse nome já foi pego por outro guerreiro!").
  - Criação de Sala Online (`src/app/criar/page.tsx`):
    - Habilitação completa do fluxo Online: nome da sala, senha opcional, vidas (fixas/aleatórias), organizador (jogador/espectador), teto de cartas e limite de jogadores.
    - Chamada a `POST /api/rooms`, persistência de token em `localStorage` e redirecionamento automático para `/sala/[code]`.
  - Cliente de Tempo Real e Hook `useRoom` (`src/lib/client/`):
    - `api.ts`: Cliente HTTP tipado com tratamento de erros `ApiError`.
    - `room-tokens.ts`: Gerenciamento seguro de tokens de sala em `localStorage` com chave por código.
    - `supabase.ts`: Inicialização singleton do Supabase no browser utilizando exclusivamente Anon Key pública e apenas para canais Broadcast.
    - `realtime.ts` (`useRoom`): Reconciliação robusta de estado com snapshot inicial, escuta de broadcast em `room:{code}`, descarte de versões defasadas, polling de segurança a cada 10s se silencioso, reconexão imediata em foco da janela e detecção de ausência (presença leve `SET_AWAY` após 60s em segundo plano).
  - Tela de Entrada na Sala (`src/components/game/JoinRoomScreen.tsx`):
    - Exibição de dados mínimos da sala (nome, quantidade de jogadores, status).
    - Validação de senha protegida contra brute force com mensagens amigáveis.
    - Atalho "Entrar com meu perfil" ou entrada anônima com seleção de cor livre da paleta (cores ocupadas desabilitadas).
    - Entrada automática como Espectador caso a partida já esteja rolando.
  - Lobby Ao Vivo e Interativo (`src/components/game/LobbyView.tsx`):
    - Cabeçalho cartoon com nome da sala, código de 6 caracteres gigante e status ao vivo.
    - Compartilhamento via Web Share API, botão de copiar link e modal com QR Code em alta definição (`QrCodeModal.tsx`).
    - Grid de guerreiros com animação de entrada pop/bounce, coroa de Host, badges de status e indicador "VOCÊ".
    - Controles de Host: expulsão de jogadores (com confirmação em modal), botão "INICIAR PARTIDA" (bloqueado com < 2 jogadores).
    - Controles de Jogador: botão "Sair da Sala".
  - Rota Dinâmica `/sala/[code]` (`src/app/sala/[code]/`):
    - Suporte a transição suave de Lobby para Partida em Andamento, sincronização de rodadas e modo tela cheia.
  - Testes:
    - 75 testes passando (8 novos testes de Lobby, entrada com senha, QR Code e controles de host em `src/app/sala/__tests__/lobby.test.tsx`).
  - Linters, typecheck e build de produção 100% limpos.
- Desvios da planta:
  - Nenhum.
- Pendências:
  - Nenhuma. Pronto para a Fase 7 (Partida Online Completa e Telão).

### Fase 7
- Feito:
  - Partida Online Completa em Tempo Real (`src/app/sala/[code]/`):
    - Ciclo completo de jogo sincronizado: `lobby` -> `round` (mão física com indicação de cartas e dealer rotativo) -> `reporting` (apuração com stepper individual e indicador de quem confirmou) -> `reveal` (animações determinísticas Toon FX via seed) -> `finished` (vitória/empate com revanche).
    - Controles de Host online: Iniciar, Encerrar Rodada, Forçar Fechamento de Rodada (`FORCE_CLOSE`), Próxima Rodada (`NEXT_ROUND`), Ajuste ±1 de vida direto (`HOST_ADJUST`), Desfazer Última Rodada (`UNDO_LAST_ROUND`), e Revanche (`REMATCH`).
    - Papel de Espectador com entrada automática após início da partida.
  - Sincronização Dramática Toon FX:
    - Uso rigoroso de `lastReveal.seed` para que todos os clientes vejam as mesmas animações de golpes e mortes.
    - Suporte a vidas ocultas: exibe quem tomou golpe e quem morreu sem vazar vida restante.
  - Consenso de Vida Online (`ProposalBar.tsx`):
    - Qualquer guerreiro vivo pode propor `+1` ou `-1` de vida para um alvo.
    - Card de votação em tempo real com contagem de votos e aprovação unânime dos demais guerreiros vivos.
    - Rejeição imediata se houver 1 voto contra.
  - Log de Eventos da Arena ("O que rolou"):
    - Painel recolhível exibindo eventos em tempo real em linguagem cartoon (golpes desferidos, distribuidor da vez, confirmações).
  - Modo Telão Gigante (`/sala/[code]/telao`):
    - Layout especial para TVs, projetores e telões sem botões de controle de jogo.
    - Proteção por senha (pede uma única vez se a sala for protegida).
    - Animações cartoon maximizadas (`isTelao={true}`) e Wake Lock ativo.
  - Testes:
    - 78 testes no Vitest passando (3 novos testes de integração multi-client com servidor simulando 3 jogadores, confirmações fora de ordem, edição antes do fechamento, consenso unânime e desfazer rodada em `src/app/sala/__tests__/online-match.test.ts`).
  - Linters, typecheck e build de produção 100% limpos.
- Desvios da planta:
  - Nenhum.
- Pendências:
  - Nenhuma. Pronto para a Fase 8 (Polimento, Qualidade e Deploy).

### Fase 8

## Decisões tomadas pelo agente
- 
