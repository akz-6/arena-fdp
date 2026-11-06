# FASE 6 — Online: Criar sala, link e Lobby ao vivo

Leia primeiro: `AGENTS.md`, `01-PLANTA.md` (seções 3.2, 3.3, 3.4), contratos da Fase 5.

```xml
<superprompt phase="6" name="Online Lobby">
  <role>
    Engenheiro full-stack sênior com doutorado, especialista em tempo real, UX mobile e resiliência de conexão.
  </role>

  <context>
    Agora o Online ganha interface: perfil global com nome único, criação de sala, link/QR, entrada de jogadores e lobby ao vivo.
  </context>

  <read_first>
    <file>AGENTS.md</file>
    <file>01-PLANTA.md</file>
  </read_first>

  <objective>
    Fluxo completo até o lobby: criar sala online, compartilhar link, jogadores entram (perfil ou aleatório) e aparecem ao vivo; host pode expulsar e iniciar.
  </objective>

  <constraints>
    <item>Cliente só escuta Broadcast; toda escrita via fetch para as rotas.</item>
    <item>Cliente Supabase no browser usa apenas a anon key e somente para Realtime.</item>
    <item>Reconciliar estado por snapshot: ao montar, ao reconectar, ao voltar o foco da aba e a cada 10s sem eventos. Ignorar versões menores que a atual.</item>
    <item>Tokens da sala em localStorage por código de sala; entrar novamente reaproveita o token.</item>
    <item>Reaproveitar componentes e estilo das fases anteriores.</item>
  </constraints>

  <tasks>
    <task id="6.1" title="Perfil global (/perfil)">
      Evoluir o perfil local: checagem de nome em tempo real (debounce, GET /api/profile/check), criar via POST /api/profile,
      exibir o código de recuperação UMA vez com botão copiar e aviso claro, tela "Recuperar perfil" com nome + código,
      editar nome/cor (PATCH). Erro 409 com mensagem amigável ("Esse nome já foi pego!").
    </task>
    <task id="6.2" title="Criar sala online (/criar)">
      Habilitar o passo Online com todas as opções da planta (seção 3.3) + senha opcional.
      Ao criar: POST /api/rooms, salvar token, ir para /sala/CODIGO como host.
    </task>
    <task id="6.3" title="Entrar (/sala/[code])">
      Se não há token da sala: tela de entrada. Se a sala tem senha, pedir senha.
      Se há perfil: cartão "Entrar como [nome]" com botão Entrar e link "usar outro nome/cor nesta sala".
      Sem perfil: Sheet de nome e cor (ambos opcionais; vazio = aleatório único) com ColorPicker mostrando cores ocupadas.
      Mensagens claras: sala cheia (expectedPlayers), sala inexistente, senha incorreta, partida em andamento (entrar como espectador).
    </task>
    <task id="6.4" title="Lobby ao vivo">
      Cabeçalho com nome da sala, CÓDIGO grande, botão copiar link, compartilhar (Web Share API com fallback) e QR code (gerar em SVG no cliente sem dependência pesada ou usando lib pequena).
      Lista de jogadores entrando com animação de pulo (Avatar), contador "X/Y" ou "X jogadores" se ilimitado.
      Host: expulsar (com confirmação e animação de chute), transferir host, ajustar config enquanto está no lobby (mesmos campos), botão Iniciar (≥ 2 jogadores).
      Jogador: botão Sair. Indicador de conexão (online/reconectando).
    </task>
    <task id="6.5" title="Hook de tempo real (src/lib/client/realtime.ts)">
      useRoom(code): carrega snapshot, assina canal "room:{code}", aplica estado público no store, expõe { state, me, isHost, connection, send(action) }.
      send() faz POST /action com tratamento de 409 (retry automático) e erros tipados (toast).
      Reconexão com backoff e snapshot ao reconectar.
    </task>
    <task id="6.6" title="Presença leve">
      Marcar jogador como "away" via action SET_AWAY quando a aba fica oculta por mais de 60s e voltar ao retomar (debounce no cliente). Mostrar Avatar em estado away.
    </task>
    <task id="6.7" title="Testes">
      Testes do hook com canal e fetch mockados: aplica snapshot, ignora versão antiga, reconecta e reconcilia.
      Teste de UI do lobby: jogador aparece ao receber broadcast; host vê Iniciar apenas com ≥ 2 jogadores.
      Teste manual documentado em README: abrir 3 abas/janelas anônimas.
    </task>
  </tasks>

  <acceptance_criteria>
    <item>lint, typecheck, test e build passam.</item>
    <item>Com Supabase real: host cria, 2+ abas entram e aparecem ao vivo no lobby em menos de 2s.</item>
    <item>Nome duplicado no perfil é recusado; sem perfil recebe nome e cor aleatórios únicos; cor repetida na sala é bloqueada.</item>
    <item>Reabrir a aba reaproveita o token e reconecta ao lobby.</item>
  </acceptance_criteria>

  <self_review>
    Reabrir 01-PLANTA.md seções 3.2 a 3.4. Conferir C6, C9, C10, C11, C12 e que o link/código/QR funcionam.
  </self_review>

  <handoff>
    Atualizar PROGRESSO.md. Documentar o contrato do hook useRoom para a Fase 7.
  </handoff>
</superprompt>
```
