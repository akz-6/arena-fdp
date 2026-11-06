# FASE 1 — Fundação + Design System

Leia primeiro: `AGENTS.md`, `01-PLANTA.md` (seções 1, 4, 8, 9), `02-DESIGN-SYSTEM.md`.

```xml
<superprompt phase="1" name="Fundacao e Design System">
  <role>
    Engenheiro de software sênior com doutorado, especialista em Next.js, design systems e animação web.
  </role>

  <context>
    Projeto FDP: app web estilo aplicativo para um jogo de cartas físico. Esta fase cria apenas a fundação:
    projeto, tokens visuais cartoon (branco predominante), componentes base e a home.
    Nenhuma regra de jogo e nenhum backend nesta fase.
  </context>

  <read_first>
    <file>AGENTS.md</file>
    <file>01-PLANTA.md</file>
    <file>02-DESIGN-SYSTEM.md</file>
  </read_first>

  <objective>
    Ter um projeto Next.js rodando, com design system toon completo e uma home navegável, pronto para receber as próximas fases.
  </objective>

  <constraints>
    <item>Next.js (App Router) + TypeScript estrito + Tailwind CSS + Framer Motion + Zustand + Zod.</item>
    <item>Fontes via next/font/google: Bangers e Fredoka.</item>
    <item>Sem imagens externas; todo visual em SVG/CSS inline e original.</item>
    <item>Textos da UI em português do Brasil.</item>
    <item>Compatível com Vercel (build padrão do Next.js, sem configuração especial).</item>
    <item>Respeitar prefers-reduced-motion em todas as animações.</item>
  </constraints>

  <tasks>
    <task id="1.1" title="Criar projeto">
      Inicializar com create-next-app (TypeScript, Tailwind, App Router, src dir, alias @/*, ESLint).
      Instalar: framer-motion, zustand, zod, vitest, @vitest/coverage-v8, jsdom, @testing-library/react.
      Scripts em package.json: dev, build, start, lint, typecheck (tsc --noEmit), test (vitest run).
      tsconfig com strict true e noUncheckedIndexedAccess true.
    </task>
    <task id="1.2" title="Tokens e estilos globais">
      Criar src/styles/tokens.css com TODOS os tokens do 02-DESIGN-SYSTEM.md e expô-los ao Tailwind.
      Fundo global branco com pontilhado halftone sutil (radial-gradient) usando --paper-2.
      Classes utilitárias: .toon-outline, .toon-shadow, .toon-press.
    </task>
    <task id="1.3" title="Componentes base em src/components/ui">
      ToonButton (primary/danger/ghost, tamanhos sm/md/lg, estado loading, press effect),
      ToonCard (rotação opcional), ToonInput (label, erro, contador), ColorPicker (12 cores, itens desabilitados riscados),
      Stepper (−/+, min/max, bounce), Sheet (modal inferior com foco preso e ESC), Toast (provider + hook useToast),
      Switch e Segmented (alternar opções).
      Todos acessíveis (rótulos, foco visível, alvo de toque ≥ 48px).
    </task>
    <task id="1.4" title="Componentes toon em src/components/toon">
      Mascot (personagem original da home: blob branco com contorno, olhos grandes, piscando e respirando),
      SpeechBubble, Burst (explosão estrelada com texto, ex.: POW).
      Avatar básico (corpo blob na cor recebida + olhos; estados serão expandidos na Fase 3).
    </task>
    <task id="1.5" title="Layout e navegação">
      Layout raiz com mobile-first (largura máx. 480px centralizada em desktop com moldura toon opcional), barra superior com voltar/título,
      transições de página curtas (fade + slide), metadata e viewport para app (theme-color branco).
      Páginas: / (home), /perfil, /criar, /regras como placeholders estilizados com título e "em breve".
    </task>
    <task id="1.6" title="Home">
      Mascote animado, título "FDP" em Bangers com contorno e sombra dura, e quatro botões grandes:
      Criar sala (primary), Entrar com código (abre Sheet com input de 6 caracteres, maiúsculas, navega para /sala/CODIGO),
      Perfil, Regras. Rodapé discreto com versão.
    </task>
    <task id="1.7" title="Página de vitrine interna">
      Rota /_dev/ui (apenas em desenvolvimento, notFound() em produção) listando todos os componentes e estados para revisão visual.
    </task>
    <task id="1.8" title="Qualidade">
      ESLint sem erros, typecheck limpo, um teste de renderização de ToonButton e Stepper (Vitest + Testing Library).
      README.md curto com como rodar.
    </task>
  </tasks>

  <acceptance_criteria>
    <item>npm run lint, npm run typecheck, npm run test e npm run build passam sem erros.</item>
    <item>Home abre sem scroll horizontal em 360px de largura; branco é a cor predominante.</item>
    <item>Todos os botões têm press effect e foco visível; com prefers-reduced-motion não há movimento contínuo.</item>
    <item>/_dev/ui mostra todos os componentes; em produção retorna 404.</item>
    <item>Nenhum asset externo além das fontes do next/font.</item>
  </acceptance_criteria>

  <self_review>
    Reabrir 01-PLANTA.md e 02-DESIGN-SYSTEM.md. Conferir: tokens completos, tipografia, rotas da seção 8, estrutura de pastas da seção 9.
    Corrigir divergências antes de encerrar.
  </self_review>

  <handoff>
    Atualizar PROGRESSO.md (feito, desvios, pendências). Não iniciar a Fase 2 sem a revisão concluída.
  </handoff>
</superprompt>
```
