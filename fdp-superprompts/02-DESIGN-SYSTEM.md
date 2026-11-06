# 02 — DESIGN SYSTEM (Cartoon / Toon Force)

## Direção
Fundo **branco predominante**. Estilo desenho animado clássico + borracha elástica exagerada (inspiração: Looney Tunes e a física "Gear 5"): contornos grossos, sombras duras, squash & stretch, olhos que saltam, onomatopeias. **Arte 100% original**.

## Tokens (`src/styles/tokens.css`)

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#FFFFFF` | Fundo principal (≥70% da tela) |
| `--paper-2` | `#F6F6F2` | Cartões secundários, pontilhado halftone |
| `--ink` | `#121212` | Contorno, texto |
| `--yellow` | `#FFD60A` | Destaque primário, botões principais |
| `--red` | `#FF3B30` | Dano, perigo |
| `--blue` | `#1E90FF` | Ações secundárias |
| `--green` | `#2ECC71` | Confirmar, vida |
| `--pink` | `#FF4FA3` | Detalhes, onomatopeias |
| `--orange` | `#FF9500` | Explosões |
| `--purple` | `#8E5CF7` | Magia, vitória |
| `--outline` | `4px solid var(--ink)` | Borda padrão |
| `--shadow` | `6px 6px 0 var(--ink)` | Sombra dura |
| `--radius` | `18px` | Cantos |

Paleta de personagens (12 cores únicas por sala): `#FF3B30 #FF9500 #FFD60A #2ECC71 #00C2A8 #1E90FF #5B6CFF #8E5CF7 #FF4FA3 #8B5E3C #6B7280 #111111`.

## Tipografia (via `next/font/google`)
- Títulos/onomatopeias: **Bangers**
- Interface: **Fredoka** (400/500/600)
- Tamanhos fluidos com `clamp()`; botões mínimo 48px de altura (toque).

## Componentes base
- **ToonButton**: borda 4px, sombra dura; `:active` = translate(4px,4px) + sombra some; hover com squash leve. Variantes: primary (amarelo), danger (vermelho), ghost (branco).
- **ToonCard**: branco, borda 4px, sombra dura, leve rotação (−1° a 1°) opcional.
- **ToonInput**: borda grossa, foco com sombra amarela.
- **ColorPicker**: grade de 12 círculos; ocupada = riscada e desabilitada.
- **Stepper** (− / número / +) com bounce ao mudar.
- **SpeechBubble**, **Burst** (explosão POW/BANG/BONK), **Sheet** (modal inferior), **Toast**.
- **Avatar**: blob/boneco SVG original, corpo na cor do jogador, olhos grandes; estados `idle` (respira), `hit`, `dead`, `win`, `away`.

## Movimento
- Biblioteca: Framer Motion + SVG/CSS. Sem canvas pesado, sem vídeos, sem imagens externas.
- Springs com overshoot (stiffness 300–500, damping 12–18) para sensação elástica.
- Squash & stretch: escala X/Y inversas em impactos.
- Screen shake curto em impactos (desligável).
- `prefers-reduced-motion`: trocar por fades e estáticos; manter onomatopeia estática.
- Todo efeito tem botão **Pular** (local) e duração máx. 3,5s (morte máx. 5s).

## Catálogo de efeitos (Fase 3)
**Golpes:** Tiro (bandeirinha "BANG!" sai do cano), Facada de borracha (faca dobra, personagem "plin"), Murro elástico (braço estica, personagem achata e voa), Bigorna, Torta na cara, Marreta "BONK" com estrelinhas, Dinamite (rosto chamuscado), Frigideira, Piano caindo.
**Mortes:** Fantasminha sobe com auréola e harpa, Achatado que desmonta em pedacinhos, Buraco no chão (cai e some), Olhos em espiral e giro até sumir, Lápide "DESCANSE EM PAZ", Iris-out circular com "FIM!".
**Vitória:** coroa gigante, confete cartoon, personagem saltando elástico.

## Tom de texto (pt-BR)
Curto, debochado, exclamativo: "AI! Levou um piano!", "FULANO MORREU!", "Última pessoa em pé!".

## Acessibilidade
Contraste texto/fundo ≥ 4.5:1; foco visível; rótulos ARIA; não depender só de cor (nome + ícone); suporte a leitor de tela nos eventos ("Fulano tomou 2 de dano").
