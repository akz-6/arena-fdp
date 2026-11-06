# Arena FDP 🃏👑

Plataforma digital para gerenciar partidas do jogo físico **FDP** (variação dinâmica e cartoon de truco com vidas e eliminações).

> **"A partida só acaba quando sobra um."**

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js (App Router) + React 19
- **Linguagem:** TypeScript (estrito com `noUncheckedIndexedAccess`)
- **Estilização:** Tailwind CSS v4 + Design Tokens Cartoon
- **Animações:** Framer Motion (Toon Force)
- **Gerenciamento de Estado:** Zustand
- **Validação:** Zod
- **Testes:** Vitest + React Testing Library

---

## 🚀 Como Executar

### 1. Instalar dependências
```bash
npm install
```

### 2. Rodar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000`.

### 3. Vitrine de Componentes Toon (Apenas em Desenvolvimento)
Acesse `http://localhost:3000/_dev/ui` para inspecionar todos os botões, cards, avatares, controles e animações da biblioteca visual.

---

## 🧪 Qualidade e Testes

- **Typecheck:** `npm run typecheck`
- **Lint:** `npm run lint`
- **Testes Unitários:** `npm run test`
- **Build de Produção:** `npm run build`
