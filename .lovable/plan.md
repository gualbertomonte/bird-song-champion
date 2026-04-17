

## Redesign visual completo — "Aviário Premium"

Proposta de refinamento estético em todo o app, mantendo 100% das funções intactas. Foco: confiança, segurança, acolhimento + um toque moderno.

### Conceito visual

**"Aviário Premium"** — inspirado em casas de leilão de aves de elite e cadernetas de criadores tradicionais, com toque digital moderno.

- **Paleta refinada**: verde-floresta profundo (`#0A2E22`) + dourado champanhe (`#C9A961`, menos saturado que o atual `#D4AF37`) + cremes quentes (`#F5F1E8` para textos sobre escuro) + acentos de cobre suave para ações secundárias.
- **Tipografia dupla**: `Fraunces` (serif moderna) para títulos e números grandes — passa tradição/confiança. `Inter` continua para corpo — passa clareza/modernidade.
- **Texturas sutis**: grão de papel discreto em cards de destaque, divisores dourados finos (1px) em vez de bordas duras.
- **Cantos**: raio aumentado para `1rem` em cards principais, `0.625rem` em inputs — sensação acolhedora.
- **Sombras**: trocadas por sombras quentes coloridas (verde/dourado a 5% opacidade) em vez de pretas — sensação premium e não clínica.
- **Animações**: entradas suaves de 400ms com easing customizado, hover com lift sutil (-2px) e brilho dourado.

### O que muda visualmente (sem mexer em funções)

1. **Tema global** (`src/index.css` + `tailwind.config.ts`)
   - Nova paleta HSL (mantém variáveis, só ajusta valores).
   - Adiciona fontes Fraunces (serif) via Google Fonts.
   - Novas classes utilitárias: `.card-premium`, `.heading-serif`, `.divider-gold`, `.glow-gold`.

2. **Sidebar** (`AppLayout.tsx`)
   - Logo "Plantel Pro+" com tipografia serif e ícone de pena estilizado.
   - Item ativo ganha barra dourada lateral + leve brilho.
   - Avatar do usuário com email no rodapé (mais acolhedor que só texto).

3. **Header**
   - Busca com ícone de pena + placeholder mais convidativo.
   - Saudação contextual ("Bom dia, [nome]") ao lado do sino.

4. **Dashboard** (`Dashboard.tsx`)
   - Cards de stats com números em serif grandes + label em uppercase tracking-wider.
   - Mini-sparklines nos cards de plantel/saúde.
   - Banner "boas-vindas" no topo (oculta após 7 dias) com mensagem acolhedora.

5. **Plantel** (`Plantel.tsx`)
   - Cards de aves com foto maior, badge da anilha em destaque, hover com elevação suave.
   - Grid mais arejado (gap maior).
   - Filtros como pills douradas selecionáveis em vez de selects.

6. **Detalhe da Ave** (`BirdDetail.tsx`)
   - Hero com foto grande à esquerda + dados em coluna serif à direita.
   - Linha do tempo (timeline) para histórico de eventos (saúde, torneios, transferências).

7. **Berçário** (`Bercario.tsx`)
   - Cards de ninhada com ilustração de ovo/progresso circular.
   - Calendário com dias destacados em dourado.

8. **Crachá Digital — V2** (`BirdDetail.tsx` modal)
   - Layout vertical "passport style":
     - Topo: faixa verde-floresta com logo Plantel Pro+ em dourado.
     - Foto circular grande com moldura dourada dupla.
     - Nome em serif grande dourado, espécie em itálico cinza-claro.
     - Bloco de dados em 2 colunas com divisores dourados finos.
     - QR Code embutido em moldura quadrada com cantos arredondados.
     - Rodapé com selo "Verificado · Plantel Pro+" + data emissão.
   - Marca d'água: silhueta de ave + monograma "PP+" muito sutil ao fundo.
   - Mantém `html2canvas` com photoDataUrl (já corrigido).

9. **PDFs — V2** (`src/lib/pdf.ts`)
   - **Cabeçalho unificado**: barra verde-floresta + logo dourado + título serif + subtítulo cinza.
   - **Rodapé**: linha dourada + "Plantel Pro+ · Página X de Y · Gerado em DD/MM/AAAA".
   - **Tabelas**: cabeçalho verde-floresta com texto creme, zebra-striping em creme muito claro, bordas em dourado 0.3pt.
   - **Tipografia PDF**: Helvetica-Bold para títulos (jsPDF nativo, sem precisar embed), corpo em Helvetica.
   - **3 templates**:
     - Recibo de Empréstimo: cabeçalho + bloco "Partes" + bloco "Aves emprestadas" + assinaturas + termo legal.
     - Plantel SISPASS: capa com totais + tabela paginada com índice.
     - Histórico de Transferências: cabeçalho + tabela + resumo no rodapé.

10. **Auth (Login/Signup/Forgot)** 
    - Background com gradiente verde-floresta + textura sutil.
    - Card central com sombra dourada, logo serif grande no topo.
    - Mensagem acolhedora: "Cuide do seu plantel com a tranquilidade que ele merece."

11. **Loading states**
    - Spinner trocado por animação de pena dourada girando.
    - Skeleton screens nos cards (pulse em creme).

12. **Mobile bottom nav**
    - Fundo com leve transparência + blur.
    - Item ativo com pill dourada de fundo.

### Diagrama de paleta

```text
Background    #0A2E22 (verde-floresta profundo)
Card          #0F3A2C (verde-floresta médio)
Primary       #C9A961 (dourado champanhe)
Accent        #B8935A (cobre suave)
Text          #F5F1E8 (creme quente)
Muted text    #8FA89C (verde-cinza)
Border        #1A4A38 (verde sutil)
Success       #4A8B6F
Danger        #C75450
```

### Arquivos tocados

- `src/index.css` — nova paleta HSL, fontes Fraunces, classes utilitárias premium
- `tailwind.config.ts` — fontFamily serif, novos keyframes
- `src/components/AppLayout.tsx` — sidebar + header redesign
- `src/pages/Dashboard.tsx` — stats serif, sparklines, banner boas-vindas
- `src/pages/Plantel.tsx` — cards de ave redesenhados, filtros pills
- `src/pages/BirdDetail.tsx` — hero + timeline + crachá V2
- `src/pages/Bercario.tsx` — cards com progresso circular
- `src/pages/Login.tsx` / `Signup.tsx` / `ForgotPassword.tsx` / `ResetPassword.tsx` — fundo + card premium
- `src/pages/Saude.tsx` / `Torneios.tsx` / `Emprestimos.tsx` / `Perfil.tsx` / `ArvoreGenealogica.tsx` — aplicar tipografia serif em títulos + ajustes de cards
- `src/lib/pdf.ts` — refatorar 3 templates com cabeçalho/rodapé unificados
- `src/components/ui/card.tsx` / `button.tsx` — variante `premium` opcional (sem quebrar usos atuais)

### Garantias

- **Zero mudança funcional**: nenhum handler, query, contexto ou rota alterado.
- **Sem migração de banco**.
- **Compatibilidade**: variantes atuais de Card/Button continuam funcionando.
- **Acessibilidade**: contraste mantido AAA em texto principal.

### Entrega faseada (recomendado)

Para evitar uma única mudança gigante e facilitar reversão, sugiro 3 fases:
- **Fase A**: tema global (cores, fontes, classes utilitárias) + Auth + AppLayout + Dashboard.
- **Fase B**: Plantel + BirdDetail (incluindo Crachá V2) + Bercário.
- **Fase C**: Saúde + Torneios + Empréstimos + Perfil + Árvore + PDFs V2.

Confirme se faço as 3 fases de uma vez OU prefere começar pela Fase A e validar antes de seguir.

