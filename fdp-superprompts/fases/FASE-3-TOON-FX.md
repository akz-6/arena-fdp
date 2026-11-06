# FASE 3 — Toon FX (personagens e animações)

Leia primeiro: `AGENTS.md`, `02-DESIGN-SYSTEM.md` (inteiro), `01-PLANTA.md` (seção 3.6).

```xml
<superprompt phase="3" name="Toon FX">
  <role>
    Engenheiro front-end sênior com doutorado, especialista em animação web (Framer Motion, SVG) e direção de arte cartoon.
  </role>

  <context>
    Dramatização é a alma do FDP. Esta fase entrega o personagem e todos os efeitos de golpe, morte e vitória, desacoplados da lógica do jogo.
    Os efeitos recebem props simples e uma seed para serem idênticos em todos os aparelhos.
  </context>

  <read_first>
    <file>AGENTS.md</file>
    <file>02-DESIGN-SYSTEM.md</file>
    <file>01-PLANTA.md</file>
  </read_first>

  <objective>
    Biblioteca de efeitos em src/components/fx e Avatar completo, com uma rota de teste /_dev/fx para ver e disparar todos.
  </objective>

  <constraints>
    <item>Arte 100% original em SVG inline; nenhum personagem, logo ou som de terceiros.</item>
    <item>Framer Motion + CSS. Sem canvas pesado, sem libs de confete externas (implementar confete em SVG/CSS).</item>
    <item>Cada efeito: duração ≤ 3,5s (morte ≤ 5s), cancelável, chama onDone() ao terminar.</item>
    <item>prefers-reduced-motion: versão estática com onomatopeia por 1s, depois onDone().</item>
    <item>60fps em celular médio: animar apenas transform e opacity.</item>
    <item>Efeitos não conhecem regras de jogo: só props (color, name, seed, intensity).</item>
  </constraints>

  <tasks>
    <task id="3.1" title="Avatar completo (toon/Avatar)">
      Boneco blob original, cor do jogador, olhos grandes com pupilas que olham, boca expressiva.
      Estados: idle (respira + pisca aleatório), hit (squash + olhos saltando), dead (olhos em X, caído), win (coroa + salto elástico), away (cinza, sono "zZ").
      Prop size (sm/md/lg). Nome embaixo em Bangers. Selo de vida opcional (coração + número) controlado por prop.
    </task>
    <task id="3.2" title="Golpes (fx/hit)">
      Implementar 9 efeitos como componentes: GunShot (bandeirinha BANG), RubberKnife, ElasticPunch (braço estica, achata, voa),
      Anvil, PieFace, BonkHammer (estrelinhas girando), Dynamite (cara chamuscada, fumaça), FryingPan, FallingPiano.
      Todos mostram Burst com onomatopeia e aplicam screen shake leve.
    </task>
    <task id="3.3" title="Mortes (fx/death)">
      Implementar 6 efeitos: GhostAscend (auréola, harpa, sobe), PancakeCrumble (achatado e desmonta), HoleFall (buraco no chão),
      SpiralSpin (olhos em espiral e giro), Tombstone (lápide "DESCANSE EM PAZ" cai com poeira), IrisOutDeath (círculo se fecha e "FIM!").
    </task>
    <task id="3.4" title="Vitória (fx/VictoryFx)">
      Coroa gigante, confete cartoon em SVG, personagem saltando elástico, faixa "ÚLTIMO EM PÉ!". Variante empate: "EMPATE! TODOS CAÍRAM!".
    </task>
    <task id="3.5" title="Diretor de efeitos (fx/FxDirector)">
      Componente que recebe uma lista de eventos (hits e mortes) + seed e executa em sequência, determinístico:
      escolhe golpe e morte via PRNG(seed, playerId). Exibe fila "Fulano levou X" e "FULANO MORREU!".
      Botão Pular (pula toda a fila) e botão Pular um item. Modo telão (escala maior).
      API: <FxDirector reveal={...} players={...} onFinish={...} showHitCount={...} />.
    </task>
    <task id="3.6" title="Utilitários">
      ScreenShake (provider com hook useShake), useReducedMotion centralizado, geração determinística de variações a partir da seed.
      Sons: módulo opcional WebAudio com bipes sintetizados (sem arquivos), desligado por padrão, toggle global "Som" persistido em localStorage.
    </task>
    <task id="3.7" title="Página de teste /_dev/fx">
      Somente dev. Lista todos os efeitos com botão "Tocar", seletor de cor, seletor de seed, toggle de reduced motion simulado e modo telão.
    </task>
    <task id="3.8" title="Testes">
      Teste de unidade: mesma seed + mesmo player produz mesma escolha de golpe/morte; FxDirector chama onFinish; reduced motion chama onDone rápido.
    </task>
  </tasks>

  <acceptance_criteria>
    <item>lint, typecheck, test e build passam.</item>
    <item>Todos os 9 golpes, 6 mortes e a vitória funcionam em /_dev/fx e terminam chamando onDone.</item>
    <item>Pular interrompe imediatamente sem erros de console.</item>
    <item>Nenhum efeito usa imagens externas; só transform/opacity animados.</item>
  </acceptance_criteria>

  <self_review>
    Reabrir 02-DESIGN-SYSTEM.md (catálogo de efeitos) e a seção 3.6 da planta. Verificar que cada item do catálogo existe e respeita limites de duração.
  </self_review>

  <handoff>
    Atualizar PROGRESSO.md com a API de FxDirector e Avatar.
  </handoff>
</superprompt>
```
