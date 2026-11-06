# FASE 7 — Online: Partida em tempo real

Leia primeiro: `AGENTS.md`, `01-PLANTA.md` (seção 5 inteira, 3.4, 3.6), `03-REGRAS-DO-JOGO.md`.

```xml
<superprompt phase="7" name="Online Partida">
  <role>
    Engenheiro full-stack sênior com doutorado, especialista em jogos multiplayer assíncronos e sincronização de estado.
  </role>

  <context>
    Lobby pronto (Fase 6). Agora a partida online completa: rodadas, reporte de dano com confirmação, revelação sincronizada com animações,
    consenso, modos de vida, espectador, telão e fim de jogo.
  </context>

  <read_first>
    <file>AGENTS.md</file>
    <file>01-PLANTA.md</file>
    <file>03-REGRAS-DO-JOGO.md</file>
  </read_first>

  <objective>
    Partida online jogável do START ao vencedor/empate, reaproveitando a engine e os componentes do Singleplayer.
  </objective>

  <constraints>
    <item>Sem lógica de regras no cliente: o cliente apenas envia actions e renderiza o estado público.</item>
    <item>Animações usam lastReveal.seed: todos os aparelhos veem os mesmos golpes e mortes; pular é local e não altera o estado.</item>
    <item>Vida oculta: nenhum dado de vida chega ao cliente; UI não exibe vida.</item>
    <item>Durante reporting, um jogador vê apenas o próprio stepper e quem já confirmou (nunca o dano dos outros antes da revelação).</item>
  </constraints>

  <tasks>
    <task id="7.1" title="Tela de partida (/sala/[code])">
      Reaproveitar RoundHeader, PlayerGrid, ReportPanel e RevealStage do Singleplayer, adaptando para múltiplos clientes.
      Jogador: vê "Rodada N • X cartas • Distribui: Fulano"; na fase reporting vê Stepper do próprio dano e botão Confirmar (editável até todos confirmarem);
      lista com status "confirmou / pensando".
      Host: botões Fim da rodada, Forçar fechamento (com confirmação), Próxima rodada, Desfazer última rodada, Expulsar, Transferir host, Ajuste ±1 direto.
      Host espectador: mesma tela sem avatar de jogador, só controles.
    </task>
    <task id="7.2" title="Revelação sincronizada">
      Ao entrar em reveal (versão nova), todos disparam FxDirector com lastReveal. Quem chegar depois vê o resumo estático.
      Modo visível: atualizar vidas após a animação. Modo oculto: mostrar quem tomou golpe (e quantos, se showHitCount) e quem morreu, sem vida restante.
      Banner global "FULANO MORREU!" para todos.
    </task>
    <task id="7.3" title="Consenso de vida">
      Qualquer jogador vivo abre proposta (+1/−1 para um alvo) por Sheet; barra de proposta ativa com Aprovar/Rejeitar para os demais; progresso "2/4 aprovaram".
      Resultado anima (cura ou dano) e entra no log.
    </task>
    <task id="7.4" title="Fim de jogo">
      Vitória (VictoryFx), empate, resumo da partida (linha do tempo de golpes; em oculto, revelar vidas iniciais ao final), Revanche (host) e Sair.
      Se o host sair, transferência automática com aviso.
    </task>
    <task id="7.5" title="Espectador e telão">
      Quem entra com partida em andamento vira espectador (somente leitura, sem controles).
      /sala/[code]/telao: leitura pública da sala com senha apenas se a sala exigir (pedir uma vez), layout gigante, FxDirector em modo telão, sem controles; usa Wake Lock.
    </task>
    <task id="7.6" title="Log de eventos">
      Painel recolhível "O que rolou" com os últimos eventos em linguagem toon (ex.: "Pato Maluco levou um piano!").
    </task>
    <task id="7.7" title="Robustez">
      Estados de carregamento e erro; reconexão no meio da animação não duplica efeito (chave por round+version); botão "Sincronizar" manual;
      tratamento de 409 com retry; proteção contra duplo clique (disabled enquanto envia).
    </task>
    <task id="7.8" title="Testes">
      Teste de integração com servidor em memória: 3 clientes simulados jogam 5 rodadas até o fim; confirmações fora de ordem; edição de dano antes da última confirmação.
      Teste de vazamento: nenhuma resposta ao cliente contém vida em modo oculto.
      Teste e2e opcional (Playwright) com 2 contextos do navegador, se viável sem credenciais reais usando o repositório em memória em modo de teste.
    </task>
  </tasks>

  <acceptance_criteria>
    <item>lint, typecheck, test e build passam.</item>
    <item>Partida de 3+ aparelhos do START ao fim; revelação idêntica em todos; empate e desfazer funcionam.</item>
    <item>Vida oculta nunca trafega nem aparece; vida visível sincroniza após a animação.</item>
    <item>Consenso aprova só com unanimidade dos vivos (exceto proponente) e rejeita com um voto contra.</item>
  </acceptance_criteria>

  <self_review>
    Reabrir 01-PLANTA.md seção 5 e 3.6. Conferir C3, C4, C5, C7, C8, C9, C11, C14, C16 em fluxo real.
  </self_review>

  <handoff>
    Atualizar PROGRESSO.md com problemas conhecidos e pontos de polimento para a Fase 8.
  </handoff>
</superprompt>
```
