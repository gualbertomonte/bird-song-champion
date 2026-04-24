

# Upgrade Premium: Dark Forest & Liquid Gold + Glassmorphism

Transformar o app num visual mais rico e premium — vidro translúcido (glassmorphism), profundidade em camadas, dourado líquido com brilho, e uma floresta escura mais cinematográfica — **sem reescrever páginas**. Como toda a UI usa classes utilitárias centralizadas (`.card-premium`, `.stat-card`, `.btn-primary`, `.auth-card`, etc.), basta evoluir os tokens de tema e essas classes que o app inteiro herda automaticamente.

## O que muda visualmente

- **Fundo cinematográfico**: gradientes radiais multi-camadas (verde-floresta profundo → musgo → âmbar sutil) com leve grão/névoa, fixo no scroll.
- **Glassmorphism**: cards, header, sidebar, modais e popovers com `backdrop-blur`, fundo translúcido (`hsl/8-14% alpha`), borda sutil em dourado e highlight superior em "luz líquida".
- **Liquid Gold**: dourado com gradiente animado em hover (champanhe → âmbar → cobre), brilho difuso atrás de elementos primários, divisores com shimmer.
- **Profundidade em camadas**: shadows mais ricas (camada interna + camada externa quente dourada), separação clara entre superfícies.
- **Microinterações**: hover lift mais elegante (1-2px + brilho dourado se intensifica), focus rings dourados translúcidos.
- **Tipografia**: nada muda (Fraunces serif + Inter já está perfeito para premium).

## Arquivos alterados (apenas 3)

**1. `src/index.css`** — coração da mudança
- Tokens HSL refinados: floresta um pouco mais profunda nas bordas, dourado com mais saturação no hover, novas variáveis `--glass-bg`, `--glass-border`, `--glass-highlight`, `--gold-glow`.
- Novas utilitárias: `.glass`, `.glass-strong`, `.glass-subtle` (3 níveis de blur/opacidade).
- `.card-premium`, `.stat-card`, `.card-hover` ganham `backdrop-blur-xl` + fundo translúcido + highlight superior dourado animado.
- `.btn-primary` com gradiente liquid-gold animado em hover (`background-position` shift) + glow externo.
- `.auth-card` mais cinematográfico (vidro espesso + halo dourado).
- `.sidebar-active` com barra dourada que pulsa suavemente.
- Body com gradient mais rico e camada de "vinheta" (escurece bordas).
- Novo keyframe `gold-shimmer` para divisores e botões.

**2. `src/components/AppLayout.tsx`** — só troca de classes
- Sidebar: `bg-sidebar` → `glass-strong` (mantém cor de fundo via token).
- Header sticky: já tem `backdrop-blur-xl`; só refinar borda dourada e adicionar leve gradiente.
- Bottom nav mobile: `glass-strong`.
- Main: adicionar uma camada de blob dourado decorativo de fundo (absolute, blur-3xl, opacity baixa) para dar vida.

**3. `src/components/ui/dialog.tsx`** — modais com vidro
- `DialogOverlay`: `bg-black/80` → `bg-background/60 backdrop-blur-md`.
- `DialogContent`: aplicar `glass-strong` + borda dourada sutil + halo.

## Fora do escopo (intencional)

- Não vou tocar em páginas individuais (Dashboard, Plantel, Torneios…) — todas herdam via classes utilitárias.
- Não vou trocar fontes nem layout/espaçamento.
- Não vou alterar componentes shadcn/ui além do `dialog` (que é o mais visível).
- Sem mudanças em lógica, dados, rotas ou backend.

## Riscos & mitigação

- **Contraste/legibilidade**: vidro translúcido pode reduzir contraste de texto. Mitigação: `--card` mantém HSL com alpha alto (≥85%) em superfícies com texto denso; blur forte só em containers visuais, não em conteúdo de leitura longa.
- **Performance em mobile**: `backdrop-blur-xl` pode pesar. Mitigação: usar `backdrop-blur-md` como padrão e reservar `xl` para sidebar/header/modais; nada de blur em listas longas.
- **Reversível**: todas as mudanças são em tokens CSS + classes utilitárias — fácil ajustar intensidade depois ("mais vidro", "menos dourado") sem refatorar páginas.

## Resultado esperado

Ao aprovar, em ~1 iteração o app inteiro (Dashboard, Plantel, Berçário, Torneios, Admin, Auth) ganha o novo visual automaticamente, mantendo identidade Aviário Premium mas com sensação de produto caro e moderno (estilo Apple Vision / Linear / Arc).

