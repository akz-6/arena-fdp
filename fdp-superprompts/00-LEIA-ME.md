# FDP — Pacote de Construção (Planta + Superprompts)

Este pacote é lido pelo **Antigravity** para construir o app do jogo de cartas físico **FDP** (variação de truco), do zero até o deploy na **Vercel**.

## Ordem obrigatória de leitura e execução

1. `AGENTS.md` (regras permanentes do agente)
2. `01-PLANTA.md` (a planta: visão, correções de lógica, arquitetura, dados, rotas)
3. `02-DESIGN-SYSTEM.md` (identidade visual cartoon, branco predominante)
4. `03-REGRAS-DO-JOGO.md` (hierarquia de cartas, ciclo de rodadas, vidas)
5. `fases/FASE-1 ... FASE-8` (um superprompt XML por fase, em ordem)
6. `99-CHECKLIST-FINAL-E-DEPLOY.md`
7. `PROGRESSO.md` (o agente atualiza ao fim de cada fase)

## Protocolo por fase (o agente DEVE seguir)

```
ANTES  -> reler 01-PLANTA.md (seções relevantes) + o superprompt da fase
FAZER  -> implementar todas as tasks da fase, nada além do escopo
TESTAR -> rodar lint, typecheck, testes e build (comandos no superprompt)
REVISAR-> reabrir 01-PLANTA.md e conferir item por item contra o que foi feito
CORRIGIR-> ajustar divergências antes de avançar
REGISTRAR-> atualizar PROGRESSO.md (feito / desvios / pendências)
SÓ ENTÃO -> iniciar a próxima fase
```

## Mapa das fases

| Fase | Nome | Resultado |
|---|---|---|
| 1 | Fundação + Design System | Projeto Next.js, tokens toon, componentes base, home |
| 2 | Motor do Jogo (engine) | Regras puras em TypeScript, testadas |
| 3 | Toon FX | Personagens, animações de dano/morte/vitória |
| 4 | Perfil + Singleplayer (local/offline) | Modo completo sem backend, PWA |
| 5 | Backend (Supabase + API) | Banco, rotas, tokens, broadcast |
| 6 | Online: Lobby | Criar sala, link, entrar, perfil/aleatório |
| 7 | Online: Partida em tempo real | Rodadas, confirmação, consenso, telão |
| 8 | Polimento + Deploy | A11y, performance, testes e2e, Vercel |

## Princípios do projeto

- **Simplicidade primeiro**: o mínimo de código que entrega o comportamento descrito.
- **Uma engine, dois modos**: Singleplayer e Online usam o mesmo motor de regras.
- **Vercel-native**: sem servidor WebSocket próprio, sem escrita em disco em runtime.
- **O app NÃO distribui cartas**: o jogo é físico. O app controla vidas, rodadas e animações.
