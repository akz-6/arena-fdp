# 01 — PLANTA DO SISTEMA FDP

> Documento mestre. O agente relê este arquivo no início e no fim de cada fase.

## 1. Visão

App web estilo aplicativo (PWA) que acompanha partidas do jogo de cartas físico **FDP**: controla **vidas**, **rodadas**, **quantas cartas por rodada** e dramatiza cada dano/morte com animações cartoon. Não distribui cartas.

Dois modos:

| | Online | Singleplayer (Local) |
|---|---|---|
| Quem precisa do site aberto | Todos | Só o organizador |
| Backend | Sim (Supabase) | Nenhum (offline, localStorage) |
| Quem lança dano | Cada jogador no próprio celular (confirmação) | O organizador lança para todos |
| Telão | Link `/sala/CODIGO/telao` | Modo telão no próprio celular/PC |

## 2. Correções de lógica aplicadas ao pedido original

| # | Problema encontrado | Correção adotada |
|---|---|---|
| C1 | Vercel não hospeda servidor WebSocket | Tempo real via **Supabase Realtime Broadcast**; toda escrita passa por Route Handlers |
| C2 | Vida oculta no cliente vazaria no DevTools | Online: vida só no servidor (`room_secrets`). Local: vida nunca é renderizada |
| C3 | "Se todos clicarem, +1/−1" era ambíguo | Vira **Consenso**: qualquer jogador propõe ±1 de vida a um alvo; passa quando todos os outros vivos aprovam. Host pode aplicar direto |
| C4 | "Clicar −1 a cada tiro" não fecha a rodada | Cada rodada tem fase de **reporte**: cada jogador marca o dano (0..N, pode ser >1) e confirma; revelação só quando todos confirmam (host pode forçar) |
| C5 | Quantidade de cartas "até acabar o baralho" não estava definida | Teto = `floor(40 × baralhos / jogadores vivos)`, recalculado a cada rodada; baralhos extras automáticos para muitos jogadores; teto manual opcional |
| C6 | Nome único no site sem login | Perfil com **token de dispositivo** + **código de recuperação**; unicidade case-insensitive no banco |
| C7 | Todos podem morrer na mesma rodada | Estado **Empate**: todos os que caíram na rodada final dividem a vitória; botão de revanche |
| C8 | Erro de digitação do organizador | **Desfazer última rodada** (host) |
| C9 | Quem entra com a partida em andamento | Entra como **espectador** (somente leitura) |
| C10 | Cores repetidas confundem | **Cor única por sala** (cores ocupadas ficam desabilitadas) |
| C11 | Host some da partida | **Transferência de host** manual ou automática (jogador vivo mais antigo) |
| C12 | "Ilimitado" de jogadores | Sem limite lógico; baralhos extras automáticos; teto técnico sugerido 100 |
| C13 | Singleplayer precisa funcionar sem internet | PWA + service worker + persistência local; mesma engine do online |
| C14 | Animações podem travar o jogo | Animações **nunca bloqueiam** o estado; pular é local; reveal persiste até "Próxima rodada" |
| C15 | Salas acumulam no banco | Expiram após 24h sem atividade (limpeza preguiçosa na criação + job opcional) |
| C16 | Host espectador também no online | `hostRole: player | spectator` vale nos dois modos |
| C17 | 7 de Paus e 7 de Espadas aparecem juntos na hierarquia | Tratados como **empatados** (confirmar com o dono; flag em `cards.ts`) |

## 3. Funcionalidades (escopo)

### 3.1 Home
Botões grandes: **Criar sala**, **Entrar com código**, **Perfil**, **Regras**. Fundo branco, mascote animado.

### 3.2 Perfil (`/perfil`)
- Nome (único no site, 2–16 caracteres) e cor (paleta de 12).
- Sem perfil: ao entrar numa sala, nome e cor aleatórios (ex.: "Pato Maluco", cor livre).
- Criar perfil gera token do dispositivo + código de recuperação (mostrado uma vez).
- Recuperar perfil em outro aparelho com o código.

### 3.3 Criar sala (`/criar`)
Passo 1: escolher **Online** ou **Singleplayer**.
Passo 2: configuração (comum aos dois):
- Nome da sala
- Senha (opcional; só Online)
- Jogadores: número esperado ou **Ilimitado**
- Vida: **Fixa (N)** ou **Aleatória (mín–máx)** com escopo **Todos iguais** ou **Individual**
- Visibilidade da vida: **Visível** ou **Oculta** (oculta = ninguém sabe, nem o próprio jogador)
- Organizador: **Joga junto** ou **Espectador** (só marca pontos)
- Mostrar quantidade de golpes na revelação (liga/desliga)
- Teto de cartas por rodada (Auto ou número)

### 3.4 Online
1. Host cria a sala → vê link, código e QR.
2. Jogadores abrem o link → (perfil ou sheet de nome/cor, em branco = aleatório) → entram no lobby.
3. Lobby mostra jogadores aparecendo ao vivo. Host pode expulsar.
4. Host inicia (mínimo 2 jogadores).
5. Partida: ver seção 5 (ciclo de rodada).

### 3.5 Singleplayer
Organizador cadastra os jogadores (nome/cor) no próprio celular, escolhe participar ou não, e opera tudo. Estado salvo localmente (retomar partida). Modo telão em tela cheia.

### 3.6 Eventos dramáticos
- Revelação de rodada: cada jogador que tomou dano recebe uma animação de arma/golpe aleatória (tiro, facada de borracha, murro elástico, bigorna, torta, marreta, dinamite, frigideira, piano).
- Morte: animação de morte engraçada + banner para todos "FULANO MORREU".
- Vitória: único vivo; confete cartoon.
- Em vida oculta: mostra **quem** tomou golpe (e quantos, se ligado), nunca a vida restante.

## 4. Arquitetura

```
Cliente (Next.js, PWA)
 ├─ UI + Framer Motion (toon FX)
 ├─ Zustand (estado de UI + espelho do estado público da sala)
 ├─ Modo Local: engine roda no cliente, persiste em localStorage
 └─ Modo Online: HTTP (fetch) para Route Handlers + Supabase Realtime (somente escuta Broadcast)

Servidor (Vercel, Route Handlers Node)
 ├─ Valida entrada (Zod) e token (jose, HS256)
 ├─ Carrega estado (Supabase, service role) -> engine.reduce() -> grava com compare-and-swap (version)
 └─ Publica no canal Broadcast `room:{code}` o estado público projetado

Supabase
 ├─ Postgres: profiles, rooms, room_secrets
 └─ Realtime Broadcast: canal por sala (sem tabelas expostas ao anon)
```

Decisões-chave:
- **Engine pura compartilhada** (`src/lib/engine`): `reduce(state, action, ctx) -> { state, events }`.
- **Projeção**: `projectPublic(state)` remove vidas quando `lifeVisibility = hidden`. Um único payload serve a todos.
- **Autoridade no servidor**: clientes nunca escrevem no banco. RLS ligada, sem policies para `anon`.
- **Concorrência**: coluna `version`; update com `where version = :v`; retry até 3x.
- **Resiliência**: cliente reconcilia por snapshot (GET) ao reconectar, ao voltar para a aba e a cada 10s se o canal estiver silencioso. Ignora versões antigas.
- **Sem WebSocket próprio, sem cron obrigatório, sem fs em runtime.**

## 5. Ciclo de rodada (máquina de estados)

```
lobby --START--> round(playing) --END_ROUND--> reporting --(todos confirmaram | FORCE_CLOSE)--> reveal
reveal --NEXT_ROUND--> round(playing)         (se houver >1 vivo)
reveal --> finished                            (se restar 1 vivo ou 0 = empate)
finished --REMATCH--> lobby
```

- `round(playing)`: tela mostra "Rodada N • X cartas • Quem distribui: Fulano". Nada a lançar ainda.
- `reporting`: cada jogador vivo vê um stepper de dano (0..vidaAtual cap implícito) e botão Confirmar. No Local, o organizador preenche todos e toca "Encerrar rodada".
- `reveal`: servidor aplica danos, calcula mortes, grava `lastReveal` (com `seed` para as animações ficarem idênticas em todos os aparelhos).
- Consenso e ajustes do host podem ocorrer em `round` e `reveal`.
- Desfazer: restaura o estado anterior à última revelação (guardado em `room_secrets`).

## 6. Dados

### Estado do jogo (engine) — esboço dos tipos

```
GameConfig {
  roomName: string
  lifeVisibility: 'visible' | 'hidden'
  lifeMode: 'fixed' | 'random'
  lifeFixed: number            // 1..99
  lifeMin: number; lifeMax: number
  lifeRandomScope: 'shared' | 'individual'
  hostRole: 'player' | 'spectator'
  showHitCount: boolean
  expectedPlayers: number | null   // null = ilimitado
  maxCardsCap: number | null       // null = auto
  decks: number | 'auto'
}

Player { id, name, color, role: 'player'|'spectator', status: 'alive'|'dead'|'away'|'kicked', joinOrder, life?: number /* segredo */ }

GameState {
  phase: 'lobby'|'round'|'reporting'|'reveal'|'finished'
  config, players[], hostId, dealerId
  roundNumber, cardsThisRound, direction: 'up'|'down'
  pendingDamage: Record<playerId, number>, confirmed: playerId[]
  lastReveal: { round, seed, hits: {playerId, damage, died}[] } | null
  proposals: { id, targetId, delta: 1|-1, approvals: playerId[], status }[]
  winners: playerId[] | null   // 1 vencedor ou vários (empate)
  version: number, seed: number
}
```

### Postgres (resumo; SQL completo na Fase 5)
- `profiles(id, name, name_key unique, color, device_secret_hash, recovery_hash, created_at)`
- `rooms(id, code unique, status, public_state jsonb, version int, created_at, updated_at, expires_at)`
- `room_secrets(room_id pk, password_hash, secret_state jsonb)`  -> vidas, hashes de token, snapshot para desfazer

## 7. API (Route Handlers)

| Método | Rota | Função |
|---|---|---|
| POST | `/api/profile` | Criar perfil (nome único) -> token + código de recuperação |
| POST | `/api/profile/recover` | Recuperar via código |
| GET | `/api/profile/check?name=` | Disponibilidade de nome |
| POST | `/api/rooms` | Criar sala (host) -> código, token do host |
| POST | `/api/rooms/[code]/join` | Entrar (senha, nome, cor) -> token do jogador |
| GET | `/api/rooms/[code]/state` | Snapshot público (reconexão, telão) |
| POST | `/api/rooms/[code]/action` | Ação do jogo (Zod discriminated union) |

Todas as ações autenticadas por `Authorization: Bearer <token da sala>`. Permissões por ação (ex.: `START` só host).

## 8. Rotas do app

`/` home • `/perfil` • `/criar` • `/regras` • `/local` (retomar) • `/local/[id]` (partida local) • `/sala/[code]` (lobby + partida) • `/sala/[code]/telao`

## 9. Estrutura de pastas

```
src/
  app/                      (rotas, layouts, api/)
  components/
    ui/                     (ToonButton, ToonCard, ToonInput, ColorPicker, Stepper, Sheet, Toast)
    toon/                   (Avatar, SpeechBubble, Burst, Mascot)
    fx/                     (HitFx/*, DeathFx/*, VictoryFx, ScreenShake, IrisOut, FxDirector)
    game/                   (PlayerGrid, RoundHeader, ReportPanel, RevealStage, ProposalBar, Lobby, Scoreboard)
  lib/
    engine/                 (types, cards, life, rounds, reducer, project, names, rng, index) + __tests__
    server/                 (supabase, auth, rooms-repo, broadcast, hash, rate-limit)
    client/                 (api, realtime, storage, stores)
  styles/                   (tokens.css)
public/ (manifest, ícones, sw)
```

## 10. Segurança e abuso
- Senha de sala: scrypt (Node crypto) com salt. Comparação em tempo constante.
- Tokens: `jose` HS256, expiração 24h, `roomId + playerId`.
- Validação Zod em toda rota. Limites: nome 2–16, sala 3–32, vida 1–99, jogadores ≤100.
- Rate limit simples por IP+rota (janela em memória best-effort; documentar limitação serverless).
- Teste automatizado: payload público nunca contém `life` quando oculto.

## 11. Fora de escopo (v1)
Distribuição virtual de cartas, chat, contas com e-mail, ranking global, pagamentos.

## 12. Perguntas em aberto (decidir com o dono depois; padrão já definido)
- 7 de Paus × 7 de Espadas: empate (padrão).
- Quando todos morrem juntos: empate com revanche (padrão).
