# FASE 2 — Motor do Jogo (engine pura)

Leia primeiro: `AGENTS.md`, `01-PLANTA.md` (seções 2, 5, 6), `03-REGRAS-DO-JOGO.md`.

```xml
<superprompt phase="2" name="Motor do Jogo">
  <role>
    Engenheiro de software sênior com doutorado em engenharia de software, especialista em máquinas de estado e testes baseados em propriedades.
  </role>

  <context>
    A engine é o coração do FDP e será usada igualmente no modo Local (cliente) e no Online (servidor).
    Deve ser 100% pura, determinística e totalmente testada. Sem UI, sem rede, sem banco.
  </context>

  <read_first>
    <file>AGENTS.md</file>
    <file>01-PLANTA.md</file>
    <file>03-REGRAS-DO-JOGO.md</file>
  </read_first>

  <objective>
    Implementar em src/lib/engine a lógica completa de lobby, rodadas, vidas, dano, consenso, empate, desfazer e projeção pública.
  </objective>

  <constraints>
    <item>Sem I/O. Proibido Date.now() e Math.random() dentro da engine: receber ctx = { now: number, rng: () => number }.</item>
    <item>Funções puras; estado imutável (retornar novo objeto).</item>
    <item>Zod para validar actions e config; tipos exportados a partir dos schemas quando possível.</item>
    <item>Cobertura de testes das regras ≥ 90% em src/lib/engine.</item>
    <item>Estado serializável em JSON (será salvo em jsonb).</item>
  </constraints>

  <tasks>
    <task id="2.1" title="Tipos e schemas (types.ts)">
      GameConfig, Player, GameState, Action (união discriminada), GameEvent, Reveal, Proposal conforme a seção 6 da planta.
      Limites: nome 2–16, vida 1–99, jogadores ≤ 100, mín ≤ máx.
    </task>
    <task id="2.2" title="Cartas (cards.ts)">
      Tabela de hierarquia da 03-REGRAS-DO-JOGO.md com ids estáveis, rótulos pt-BR, apelidos (Zap, Copeta, Espadilha, Pica-fumo) e flag TIE_SEVEN_CLUBS_SPADES = true.
      Exportar CARD_TIERS para a página /regras.
    </task>
    <task id="2.3" title="RNG e seed (rng.ts)">
      Implementar PRNG determinístico (mulberry32) a partir de seed numérica; helper pick e shuffle.
    </task>
    <task id="2.4" title="Vidas (life.ts)">
      rollInitialLives(config, playerIds, rng): fixed, random shared, random individual (inclusivo em mín e máx).
      Validar mín ≥ 1.
    </task>
    <task id="2.5" title="Rodadas (rounds.ts)">
      computeDecks(config, initialPlayers), computeMaxCards(config, aliveCount),
      nextCards({ current, direction, max }) -> { cards, direction }, seguindo exatamente: sobe até o teto, desce até 1, volta a subir; teto 1 mantém 1; ajusta se o teto cair.
      nextDealer(players, currentDealerId) pulando mortos/espectadores/expulsos.
    </task>
    <task id="2.6" title="Reducer (reducer.ts)">
      reduce(state, action, ctx) -> { state, events } com as actions:
      ADD_PLAYER, KICK, LEAVE, SET_AWAY, START, END_ROUND, SET_DAMAGE, CONFIRM, FORCE_CLOSE, NEXT_ROUND,
      PROPOSE_ADJUST, VOTE, HOST_ADJUST, TRANSFER_HOST, UNDO_LAST_ROUND, REMATCH.
      Regras:
        - Cada action traz actorId; aplicar permissões (START/FORCE_CLOSE/NEXT_ROUND/KICK/HOST_ADJUST/UNDO/REMATCH só host; SET_DAMAGE e CONFIRM do próprio jogador, ou do host quando config local (flag operatorMode)).
        - ADD_PLAYER: nome único (case-insensitive) e cor única por sala; entrada após START vira espectador; respeitar expectedPlayers.
        - START: exige ≥ 2 jogadores com role player; sorteia vidas; define dealer; rodada 1 com 1 carta, direction up.
        - END_ROUND: phase round -> reporting; zera pendingDamage e confirmed.
        - SET_DAMAGE: inteiro 0..vidaAtual; só em reporting; desfaz confirmação do jogador se mudar.
        - CONFIRM: marca confirmado; quando TODOS os vivos confirmam, aplica automaticamente CLOSE.
        - FORCE_CLOSE: host fecha mesmo com pendentes (pendentes = dano 0).
        - CLOSE (interno): aplica danos, calcula mortes, grava lastReveal { round, seed, hits[] } com seed vinda do rng, emite eventos DAMAGE e DEATH.
          Se vivos == 1 -> finished com winners=[id]. Se vivos == 0 -> finished com winners = todos que caíram na rodada (empate). Senão phase = reveal.
        - NEXT_ROUND (de reveal): rodada+1, nextCards com teto recalculado, nextDealer, phase = round.
        - Consenso: PROPOSE_ADJUST cria proposta (alvo vivo, delta +1 ou -1); VOTE aprova/rejeita; aprovada quando todos os jogadores vivos, exceto o proponente (o alvo vota também), aprovam; qualquer rejeição cancela. Aplicar vida (limite inferior 0, morte se 0). Emitir eventos.
        - HOST_ADJUST aplica ±1 direto. Se mata, emitir DEATH e checar fim de jogo.
        - TRANSFER_HOST manual; se host sai/expulso, transferir automaticamente para o jogador vivo mais antigo.
        - UNDO_LAST_ROUND: restaurar snapshot anterior à última revelação (guardar prevSnapshot dentro de um campo opcional secret do estado) e permitir só uma vez por revelação.
        - REMATCH: de finished volta a lobby mantendo jogadores e config.
      Toda mutação incrementa state.version.
    </task>
    <task id="2.7" title="Projeção pública (project.ts)">
      projectPublic(state): remove vidas e snapshots secretos quando lifeVisibility = hidden; mantém vidas quando visible.
      Nunca incluir pendingDamage de outros jogadores durante reporting (somente a lista de quem já confirmou).
      Em modo hidden, lastReveal.hits.damage só aparece se showHitCount = true; caso contrário damage fica null e died permanece.
    </task>
    <task id="2.8" title="Nomes aleatórios (names.ts)">
      Gerador toon de nomes (adjetivo + bicho/objeto, ex.: "Pato Maluco", "Tomate Bravo") com sufixo opcional,
      garantindo unicidade contra uma lista de nomes ocupados; escolha de cor livre aleatória.
    </task>
    <task id="2.9" title="Testes (Vitest)">
      Cobrir: sequência de cartas (teto 1, 2, 4, 7 e mudança de teto no meio), baralhos extras, dealer, vida fixa/aleatória shared/individual,
      permissões por action, fluxo completo de uma partida de 3 jogadores até vencedor, empate (todos zeram), consenso aprovado/rejeitado,
      HOST_ADJUST que mata, transferência de host, desfazer, rematch, entrada tardia como espectador,
      e propriedade: em hidden, JSON.stringify(projectPublic(state)) nunca contém o campo "life".
    </task>
    <task id="2.10" title="Barrel e documentação">
      src/lib/engine/index.ts exportando a API pública. Comentário de módulo em cada arquivo explicando responsabilidade.
    </task>
  </tasks>

  <acceptance_criteria>
    <item>npm run lint, typecheck, test e build passam; cobertura da engine ≥ 90%.</item>
    <item>Nenhum uso de Date.now ou Math.random em src/lib/engine (verificar com grep).</item>
    <item>Simulação aleatória de 500 partidas (seed fixa) sempre termina com winners válido e sem vida negativa.</item>
    <item>Teste de vazamento de vida oculta passa.</item>
  </acceptance_criteria>

  <self_review>
    Reabrir 01-PLANTA.md (seções 2, 5, 6) e 03-REGRAS-DO-JOGO.md. Conferir cada correção C3, C4, C5, C7, C8, C9, C11, C14 implementada e testada.
  </self_review>

  <handoff>
    Atualizar PROGRESSO.md com a API pública da engine (assinaturas) para as fases seguintes.
  </handoff>
</superprompt>
```
