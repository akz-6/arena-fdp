# FASE 8 — Polimento, Qualidade e Deploy (Vercel)

Leia primeiro: `AGENTS.md`, `01-PLANTA.md` (inteira), `99-CHECKLIST-FINAL-E-DEPLOY.md`.

```xml
<superprompt phase="8" name="Polimento e Deploy">
  <role>
    Engenheiro de software sênior com doutorado, especialista em qualidade, performance, acessibilidade e entrega contínua na Vercel.
  </role>

  <context>
    Todas as funcionalidades existem. Esta fase endurece o produto e o prepara para GitHub + Vercel.
  </context>

  <read_first>
    <file>AGENTS.md</file>
    <file>01-PLANTA.md</file>
    <file>99-CHECKLIST-FINAL-E-DEPLOY.md</file>
  </read_first>

  <objective>
    Produto estável, acessível, rápido e implantável na Vercel sem ajustes manuais além das variáveis de ambiente.
  </objective>

  <constraints>
    <item>Não adicionar funcionalidades novas; apenas corrigir, otimizar e documentar.</item>
    <item>Manter compatibilidade total com Vercel (sem servidor custom, sem fs em runtime).</item>
  </constraints>

  <tasks>
    <task id="8.1" title="Auditoria de conformidade com a planta">
      Percorrer 01-PLANTA.md item por item (seções 2, 3, 5, 7, 8, 10) e registrar em PROGRESSO.md: implementado / divergente / faltando. Corrigir tudo que faltar.
    </task>
    <task id="8.2" title="Acessibilidade">
      Navegação por teclado, foco visível, ARIA em Sheet/Toast, anúncios (aria-live) para eventos (dano, morte, vitória), contraste ≥ 4.5:1,
      alvo de toque ≥ 48px, prefers-reduced-motion em todos os efeitos, opção global "Reduzir animações".
    </task>
    <task id="8.3" title="Performance">
      Lighthouse mobile ≥ 90 em Performance e Acessibilidade na home. Carregar efeitos de animação com next/dynamic apenas quando necessários,
      evitar re-renders desnecessários (selectors do Zustand), checar tamanho do bundle por rota.
    </task>
    <task id="8.4" title="Robustez e segurança">
      Revisar rate limits, mensagens de erro sem vazar detalhes, cabeçalhos de segurança em next.config (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors via CSP básica),
      sanitização de nomes (sem HTML), limites de tamanho de payload, expiração de tokens e salas.
    </task>
    <task id="8.5" title="Testes e CI">
      Rodar toda a suíte; adicionar workflow GitHub Actions (.github/workflows/ci.yml): install, lint, typecheck, test, build.
      Garantir que o build não exige variáveis secretas (usar valores dummy no CI).
    </task>
    <task id="8.6" title="Preparação Vercel">
      vercel.json mínimo (apenas se necessário; preferir zero-config), confirmar Node runtime nas rotas, listar variáveis de ambiente no README e em .env.example.
      Verificar que nenhuma rota depende de estado em memória para correção (rate limit é best-effort).
      Gerar página 404 e error boundary toon, favicon e ícones PWA finais.
    </task>
    <task id="8.7" title="Documentação final">
      README completo: o que é o FDP, como rodar local, como configurar Supabase, como fazer deploy na Vercel, como jogar (resumo), solução de problemas.
    </task>
    <task id="8.8" title="Passada final">
      Rodar o roteiro do 99-CHECKLIST-FINAL-E-DEPLOY.md e marcar cada item em PROGRESSO.md.
    </task>
  </tasks>

  <acceptance_criteria>
    <item>lint, typecheck, test e build passam localmente e no CI.</item>
    <item>Auditoria da planta sem itens "faltando".</item>
    <item>Checklist final 100% marcado.</item>
  </acceptance_criteria>

  <self_review>
    Reabrir 01-PLANTA.md inteira e comparar com o produto final. Registrar divergências aceitas e justificativas.
  </self_review>

  <handoff>
    Atualizar PROGRESSO.md com status final e instruções de deploy.
  </handoff>
</superprompt>
```
