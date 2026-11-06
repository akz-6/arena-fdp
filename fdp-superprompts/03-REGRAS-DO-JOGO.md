# 03 — REGRAS DO JOGO FDP (para o app)

## 1. Hierarquia de cartas (do mais fraco ao mais forte)

Os **4 de Copas, 4 de Espadas e 4 de Ouros** são as cartas mais fracas (empatadas). Depois, na ordem:

| Pos. | Carta(s) | Observação |
|---|---|---|
| 1 | 5 (todos os naipes) | |
| 2 | 6 (todos os naipes) | |
| 3 | 7 de Paus e 7 de Espadas | empatadas (ver C17 na planta) |
| 4 | Dama (Q) | |
| 5 | Valete (J) | |
| 6 | Rei (K) | |
| 7 | Ás (exceto o Ás de Espadas) | |
| 8 | 2 (todos os naipes) | |
| 9 | 3 (todos os naipes) | |
| 10 | 7 de Ouros | **Pica-fumo** |
| 11 | Ás de Espadas | **Espadilha** |
| 12 | 7 de Copas | **Escopeta / Copeta** |
| 13 | 4 de Paus | **Zap** (a mais forte) |

O app usa esta tabela apenas na página **/regras** (consulta visual e interativa). Não compara cartas na partida.

## 2. Vidas
- Fixa: todos começam com N (1–99).
- Aleatória: valor entre mín e máx. `shared` = um sorteio para todos; `individual` = um sorteio por jogador.
- Vida chega a 0 = morto. Último vivo vence. Se todos zeram na mesma rodada: empate.

## 3. Cartas por rodada
- Rodada 1 = 1 carta; depois 2, 3, 4... subindo.
- Teto = `floor(40 × baralhos / jogadores vivos)` (ou o teto manual do organizador, o menor dos dois).
- Ao atingir o teto, desce (…4, 3, 2, 1) e volta a subir. O "1" não repete no ponto de virada.
- O teto é **recalculado a cada rodada** conforme jogadores morrem. Se o teto cair abaixo das cartas atuais, ajusta para o teto e segue descendo.
- Baralhos extras automáticos: `baralhos = ceil(jogadoresIniciais / 20)` (mínimo 1), editável.
- Quem distribui gira entre os vivos (ordem de entrada), pulando mortos.

Sequência exemplo com teto 4: 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1...

## 4. Dano
Em cada rodada, cada jogador vivo informa o dano sofrido (inteiro ≥ 0, pode ser maior que 1). A vida nunca fica abaixo de 0.
