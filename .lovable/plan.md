

# Landing Page de alta conversão — focada em trazer mais usuários

Reformular o plano da landing pública em `/` para ser **orientada a conversão** (não só institucional). O objetivo deixa de ser "explicar o app" e passa a ser **transformar visitante em cadastro**.

## Princípios de conversão aplicados

- **Promessa clara em 3 segundos**: hero responde "o que é + pra quem + qual benefício".
- **Prova social** logo abaixo do hero (gera confiança antes do scroll).
- **CTA repetido 4x** ao longo da página (hero, após features, após depoimentos, bloco final).
- **Gratuidade explícita**: "Grátis para começar • Sem cartão de crédito".
- **Urgência suave**: "Junte-se a centenas de criadores".
- **Redução de fricção**: cadastro em 1 clique destacado, login secundário.

## Estrutura da landing (`src/pages/Landing.tsx`)

1. **Navbar glass** — Logo + "Entrar" (link discreto) + **"Criar conta grátis"** (botão liquid gold destacado).

2. **Hero conversion-first**
   - Badge dourado: "Aviário Premium • Grátis para começar"
   - H1 serif grande: **"O controle profissional que seu plantel merece"**
   - Subtítulo: "Cadastre aves, acompanhe eclosões, organize torneios e cuide da saúde — tudo em um só lugar, do celular ou computador."
   - **CTA primário**: "Criar conta grátis →" (liquid gold, grande)
   - **CTA secundário**: "Já tenho conta" (ghost)
   - Microcopy: "✓ Grátis para começar  ✓ Sem cartão  ✓ Pronto em 30 segundos"
   - Mockup glass à direita (mini-dashboard fake com aves/eclosões).

3. **Faixa de prova social** — "Usado por criadores em todo o Brasil" + 4 mini-stats glass (Aves cadastradas, Eclosões registradas, Torneios organizados, Criadores ativos) com números ilustrativos.

4. **Bloco de dor → solução** — "Cansado de planilhas e cadernos perdidos?" com 3 dores comuns (esquecer doses, perder linhagem, bagunça em torneios) e como o app resolve cada uma.

5. **Recursos (grid 3x2 glass)** — Plantel, Berçário, Torneios, Saúde, Empréstimos & Amigos, Árvore Genealógica. Cada card termina com micro-benefício ("Nunca mais esqueça uma dose", etc.).

6. **Como funciona em 3 passos** — Crie conta → Cadastre seu plantel → Acompanhe tudo. Com CTA "Começar agora" no fim.

7. **Depoimentos** — 3 cards glass com depoimentos curtos de criadores (placeholder realistas, marcados claramente como exemplos até termos reais).

8. **FAQ rápido (4 perguntas)** — "É grátis mesmo?", "Funciona no celular?", "Meus dados ficam seguros?", "Posso compartilhar com amigos?". Reduz objeções finais.

9. **CTA final grande** — Bloco glass full-width: "Pronto para elevar seu aviário?" + botão "Criar conta grátis" gigante + microcopy de garantia.

10. **Footer** — Copyright, Instagram, links Login/Signup, link discreto para política/contato.

## SEO & compartilhamento

- `<title>` e `<meta description>` orientados a busca ("App para criadores de aves — controle de plantel, berçário e torneios").
- Open Graph tags (título, descrição, imagem) no `index.html` para link bonito ao compartilhar no WhatsApp/Instagram.
- H1 único e semântico.

## Roteamento (`src/App.tsx`)

- Visitante em `/` → renderiza `<Landing />`.
- Logado em `/` → Dashboard normal (comportamento atual).
- Implementação: ajustar o `ProtectedRoute` para que, quando a rota for exatamente `/` e não houver usuário, renderize a Landing em vez de redirecionar para `/login`. Demais rotas protegidas continuam indo para `/login`.

## Visual

100% dentro do tema atual (Dark Forest & Liquid Gold + glassmorphism). Reutiliza `glass`, `glass-strong`, `card-premium`, `btn-primary`, `heading-serif`. Animações fade-in suaves já existentes, respeitando `prefers-reduced-motion`. Zero CSS novo, zero dependências novas, zero imagens externas.

## Arquivos alterados

1. **`src/pages/Landing.tsx`** (novo) — toda a landing.
2. **`src/App.tsx`** — lazy-load + ajuste do guard para mostrar Landing em `/` sem login.
3. **`index.html`** — atualizar `<title>`, `<meta description>` e Open Graph para SEO/compartilhamento.

## Fora do escopo

- Sem analytics novo (podemos adicionar GA4/Plausible em iteração futura).
- Sem A/B testing.
- Sem formulário de captura de email separado (CTA vai direto pro signup, menos fricção).
- Sem mudanças no Login/Signup, backend ou demais páginas.

