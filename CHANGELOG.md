# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-11-07

### Adicionado
- **Falha Segura de Produção**: Rotas `/api/rooms*` e `/api/profile*` respondem `503 Service Unavailable` com corpo `{ error: "not_configured" }` quando o Supabase não estiver configurado em produção, a menos que a flag explícita `FDP_ALLOW_MEMORY_REPO=1` seja fornecida para testes/CI.
- **Endpoint de Saúde (/api/health)**: Endpoint determinístico retornando status booleano dos componentes críticos (`supabaseConfigured`, `realtimeConfigured`, `tokenSecretOk`, `schemaOk`) e versão sem vazar chaves ou URLs.
- **Scripts de Verificação e Smoke**:
  - `scripts/verify-env.mjs`: validação de variáveis de ambiente locais e remotas.
  - `scripts/smoke-prod.mjs`: smoke test automatizado leve e não-destrutivo para produção e previews.
- **Instruções de Infraestrutura**: Criação de `INSTRUCOES-VERCEL-SUPABASE.md` com guia passo a passo para configuração segura no painel da Vercel e Supabase.
- **Painel de Reporte Individual Online (`OnlineReportPanel`)**: Controles de incremento/decremento com limite de 15 no modo oculto, visibilidade do status de confirmação dos demais jogadores e modal de encerramento forçado (`FORCE_CLOSE`) exclusivo para o host.
- **Projeção Pública de Desfazer (`canUndo`)**: Exposição de flag booleana `canUndo` sem vazamento de histórico nem de snapshots prévios com vidas ocultas.
- **Resumo Final da Partida (`MatchSummaryTable`)**: Tabela consolidada exibida após encerramento da partida (`phase === 'finished'`) detalhando vidas finais de todos os jogadores.
- **Controles de Host no Lobby**: Modais e fluxos de transferência de host (`TRANSFER_HOST`) e alteração de parâmetros de jogo (`UPDATE_CONFIG`).
- **Botão de Sincronização Manual**: Recurso de resgate no cabeçalho da sala para recuperar o estado mais recente via snapshot forçado caso haja instabilidade no WebSocket.
- **Acessibilidade e Usabilidade (WCAG 2.1 AA)**:
  - Toggle global de movimento reduzido com suporte a `prefers-reduced-motion` e persistência local (`arena_fdp_reduced_motion`).
  - Região de anúncios de tela em tempo real com `aria-live="polite"` (`AriaLiveAnnouncer`) para dano sofrido, eliminações, propostas de vida e término da partida.
  - Correção rigorosa de taxas de contraste (mínimo 4.5:1 para texto normal e 3.0:1 para títulos).
  - Região rolável de hierarquia de cartas acessível por teclado com foco visual.

### Corrigido
- **Service Worker v2**: Rescrita completa do `public/sw.js` com bypass obrigatório para rotas de `/api/*`, `/sala/*` e domínios do Supabase Realtime, evitando estado zumbi offline em partidas online.
- **Batching Atômico no Singleplayer**: Resolução de corrida de estado ao reportar múltiplos jogadores no modo local, aplicando o reducer encadeado sobre o estado mais recente.
- **Validação de Host Espectador**: Validação na criação e no lobby impedindo início de partida com menos de 2 jogadores ativos participantes.
- **Proteção contra Side-Channels em Vida Oculta**: Eliminação de vazamento de vida por canal lateral em mensagens de erro ou limites de entrada.
- **Responsividade e Viewport (WCAG 1.4.4)**: Remoção de diretivas que bloqueavam zoom do usuário no meta viewport (`maximum-scale=1`, `user-scalable=no`).
- **Otimização de LCP Mobile**: Aplicação de atributo `sizes` e pré-carregamento com `priority` nas imagens de logo da aplicação.

### Segurança
- Validação estrita de `ROOM_TOKEN_SECRET` em ambiente de produção (mínimo de 32 caracteres e recusa do segredo padrão de desenvolvimento).
- Garantia de que segredos de serviço (`SUPABASE_SERVICE_ROLE_KEY` e `ROOM_TOKEN_SECRET`) nunca aparecem no bundle estático do cliente.
