# 99 — Checklist Final e Deploy (GitHub + Vercel)

## A. Checklist funcional

### Geral
- [ ] Fundo branco predominante; visual cartoon consistente
- [ ] Home com Criar sala, Entrar com código, Perfil, Regras
- [ ] Perfil: nome único global, cor, código de recuperação, recuperação funcional
- [ ] Sem perfil: nome e cor aleatórios únicos na sala
- [ ] /regras com hierarquia de cartas e resumo do ciclo

### Singleplayer
- [ ] Funciona 100% offline após primeira visita (PWA)
- [ ] Organizador joga junto ou como espectador
- [ ] Vida fixa, aleatória shared e individual; visível e oculta
- [ ] Vida oculta nunca aparece no DOM
- [ ] Revelação com animações (pulável); mortes com banner
- [ ] Desfazer, expulsar, ajuste ±1, revanche, retomar partida salva
- [ ] Modo telão

### Online
- [ ] Criar sala com nome, senha opcional, jogadores (número/ilimitado), vidas, visibilidade
- [ ] Link, código e QR; lobby ao vivo; expulsar; transferir host
- [ ] Partida: rodada, cartas por rodada correta, dealer rotativo
- [ ] Reporte com confirmação de todos; forçar fechamento (host)
- [ ] Revelação idêntica em todos os aparelhos
- [ ] Consenso unânime funciona; rejeição cancela
- [ ] Empate, vitória, revanche
- [ ] Espectador e telão
- [ ] Reconexão automática sem perder estado
- [ ] Nenhuma resposta/broadcast vaza vida oculta, hashes ou segredos

## B. Checklist técnico
- [ ] `npm run lint`, `typecheck`, `test`, `build` passam
- [ ] CI do GitHub verde
- [ ] Lighthouse mobile ≥ 90 (Performance e Acessibilidade na home)
- [ ] Nenhum segredo no repositório; `.env.example` completo
- [ ] RLS ativa nas 3 tabelas; sem policies para anon

## C. Passo a passo de deploy

### 1) Supabase
1. Criar projeto em supabase.com.
2. SQL Editor: executar `supabase/migrations/0001_init.sql`.
3. Project Settings > API: copiar `URL`, `anon key` e `service_role key`.
4. Realtime: manter habilitado (usamos apenas Broadcast).

### 2) GitHub
```
git init
git add .
git commit -m "FDP v1"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/fdp.git
git push -u origin main
```

### 3) Vercel
1. vercel.com > Add New > Project > importar o repositório do GitHub.
2. Framework: Next.js (detectado automaticamente). Build e output padrão.
3. Environment Variables (Production e Preview):

| Variável | Valor | Exposta ao cliente |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto | sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | sim |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | **não** |
| `ROOM_TOKEN_SECRET` | `openssl rand -base64 32` | **não** |

4. Deploy. Abrir a URL, criar sala online, entrar de dois aparelhos.
5. (Opcional) Domínio próprio em Settings > Domains.

## D. Limpeza periódica (opcional)
Salas expiram em 24h e são removidas na criação de novas salas. Para limpeza garantida, agendar no Supabase (pg_cron): `delete from rooms where expires_at < now();` a cada hora.

## E. Solução de problemas
- **Lobby não atualiza**: conferir `NEXT_PUBLIC_SUPABASE_*` e Realtime habilitado; o app reconcilia por snapshot a cada 10s.
- **Erro 500 nas rotas**: conferir `SUPABASE_SERVICE_ROLE_KEY` e `ROOM_TOKEN_SECRET` na Vercel e redeploy.
- **Nome já usado**: nomes de perfil são únicos e case-insensitive; usar o código de recuperação se for seu.
