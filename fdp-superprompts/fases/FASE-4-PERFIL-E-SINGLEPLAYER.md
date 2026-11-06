# FASE 4 — Perfil (local) + Singleplayer completo (offline)

Leia primeiro: `AGENTS.md`, `01-PLANTA.md` (seções 3.1 a 3.5, 5), `03-REGRAS-DO-JOGO.md`.

```xml
<superprompt phase="4" name="Perfil e Singleplayer">
  <role>
    Engenheiro full-stack sênior com doutorado, especialista em PWA, estado local e UX mobile.
  </role>

  <context>
    O Singleplayer roda inteiro no celular do organizador, sem internet, usando a engine da Fase 2 e os efeitos da Fase 3.
    O perfil, nesta fase, é apenas local (a unicidade global de nomes chega na Fase 5/6).
  </context>

  <read_first>
    <file>AGENTS.md</file>
    <file>01-PLANTA.md</file>
    <file>03-REGRAS-DO-JOGO.md</file>
  </read_first>

  <objective>
    Entregar o modo Singleplayer jogável do início ao fim, com perfil local, persistência, telão e PWA instalável offline.
  </objective>

  <constraints>
    <item>Sem backend e sem chamadas de rede nesta fase.</item>
    <item>Usar src/lib/engine com operatorMode = true (organizador lança dano de todos).</item>
    <item>Persistência em localStorage com versionamento de schema e migração segura (ignorar dados corrompidos).</item>
    <item>Vida oculta: a UI NUNCA renderiza vida; nem em tooltips, aria-labels ou DevTools de componentes (não passar vida aos componentes).</item>
    <item>Mobile-first, botões grandes, uso com uma mão.</item>
  </constraints>

  <tasks>
    <task id="4.1" title="Perfil local (/perfil)">
      Formulário de nome (2–16) e cor (ColorPicker). Salvar em localStorage (store Zustand persistido). Botão limpar perfil.
      Mostrar aviso: "Nome único em todo o site chega com o modo online".
    </task>
    <task id="4.2" title="Criar sala — passo 1 e 2 (/criar)">
      Passo 1: escolher Online (desabilitado com selo "em breve" nesta fase) ou Singleplayer.
      Passo 2 (Singleplayer): nome da sala; jogadores Ilimitado/número; vida Fixa ou Aleatória (mín–máx, shared/individual);
      visibilidade da vida; organizador joga junto ou espectador; mostrar golpes; teto de cartas (Auto/número).
      Validar com Zod da engine. Se o organizador joga junto, pré-preencher com o perfil.
    </task>
    <task id="4.3" title="Cadastro de jogadores (lobby local)">
      Tela para adicionar jogadores (nome opcional e cor opcional; vazios geram aleatórios únicos via names.ts), editar e remover.
      Cor única, nome único. Botão Iniciar (≥ 2 jogadores).
    </task>
    <task id="4.4" title="Partida local (/local/[id])">
      Cabeçalho: "Rodada N • X cartas • Distribui: Fulano" (grande, legível de longe).
      Grade de jogadores com Avatar; em visível mostra corações/vida, em oculto não mostra nada de vida.
      Fase round: botão grande "Fim da rodada".
      Fase reporting: lista com Stepper de dano por jogador vivo e botão "Encerrar rodada".
      Fase reveal: FxDirector com a revelação; ao final, resumo ("Quem tomou golpe") e botão "Próxima rodada".
      Barra de consenso/ajuste: botão por jogador para +1/−1 (HOST_ADJUST) com confirmação.
      Desfazer última rodada; Expulsar jogador; Reiniciar partida.
      Fim: tela de vitória/empate com resumo da partida (linha do tempo de golpes; em oculto, só revelar vidas ao final) e botões Revanche e Sair.
    </task>
    <task id="4.5" title="Persistência e retomada">
      Salvar estado a cada mudança. /local lista partidas salvas (retomar/excluir). Tolerar fechar a aba no meio da animação.
    </task>
    <task id="4.6" title="Modo telão">
      Botão "Telão" abre layout fullscreen: tipografia gigante, avatares grandes, fila de efeitos ampliada, sem controles perigosos.
      Usar Fullscreen API e Wake Lock (com fallback silencioso). Controles voltam ao tocar duas vezes.
    </task>
    <task id="4.7" title="PWA offline">
      manifest.webmanifest (nome FDP, tema branco, ícones gerados em SVG/PNG simples), service worker próprio mínimo com cache-first dos assets estáticos
      e fallback offline; registrar apenas em produção. Garantir que /local e /regras funcionam sem rede após a primeira visita.
    </task>
    <task id="4.8" title="Página /regras">
      Tabela interativa da hierarquia de cartas (CARD_TIERS), com apelidos, e explicação resumida do ciclo de rodadas e vidas (texto da 03-REGRAS-DO-JOGO.md).
    </task>
    <task id="4.9" title="Testes">
      Teste de integração (Testing Library) do fluxo: criar partida local com 3 jogadores, lançar danos, ver revelação, matar um, concluir com vencedor.
      Teste: em vida oculta o DOM não contém números de vida (buscar por data-testid="life").
      Teste de migração/corrupção do localStorage.
    </task>
  </tasks>

  <acceptance_criteria>
    <item>lint, typecheck, test e build passam.</item>
    <item>Partida completa jogável apenas offline: de criar até vencedor, incluindo empate e desfazer.</item>
    <item>Vida oculta nunca aparece no DOM; vida aleatória funciona nos escopos shared e individual.</item>
    <item>Telão e PWA funcionam; /local e /regras abrem sem rede após primeira visita (verificar no DevTools).</item>
  </acceptance_criteria>

  <self_review>
    Reabrir 01-PLANTA.md seções 3 e 5. Conferir C2, C4, C7, C8, C10, C13, C14, C16 e as opções de criação de sala (3.3).
  </self_review>

  <handoff>
    Atualizar PROGRESSO.md. Listar componentes de jogo reutilizáveis para o online (PlayerGrid, RoundHeader, ReportPanel, RevealStage).
  </handoff>
</superprompt>
```
