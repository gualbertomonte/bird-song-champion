
# 🎯 Objetivo

Trocar o **papel timbrado decorativo** (faixa verde + selo dourado + cantos + watermark sutil) por um **fundo usando a própria logo do criadouro** em todos os PDFs — mas com um **modo de leitura nítida** que protege o texto.

# 🧩 Como vai funcionar

## 1. Nova função `applyLogoBackground(doc, profile, mode)` em `src/lib/pdf.ts`

Substitui `applyWatermarkAndCorners` + parte visual de `applyHeaderAllPages`. Renderiza a logo do criadouro como **fundo da página inteira** em uma de **3 intensidades**:

| Modo | Opacidade da logo | Quando usar |
|---|---|---|
| `'destaque'` | 18% | Capa / página única (recibo) — logo bem visível |
| `'sutil'` (padrão) | 8% | Relatórios e árvore — logo perceptível mas não atrapalha |
| `'leitura'` | 3% | Tabelas longas (plantel, classificação) — máxima legibilidade |

A logo:
- Centralizada, **70% da menor dimensão da página**
- Usa `removeWhiteBackground` (já existente) para tirar fundo branco
- Aplicada em **todas as páginas** via loop `doc.setPage(i)`

## 2. **Faixa de proteção do texto** (a chave da nitidez)

Por trás de cada bloco de conteúdo importante (tabelas, parágrafos, cards da árvore), desenhar um **retângulo branco semi-transparente** (`opacity 0.85`) que "apaga" a logo localmente, garantindo contraste do texto. Nova helper `drawTextBackplate(doc, x, y, w, h, opacity = 0.85)`.

Resultado visual: a logo aparece nas margens / espaços vazios; onde tem texto, ele fica nítido.

## 3. Header simplificado (sem faixa verde nem selo)

Substituir a faixa verde + círculo dourado por um **cabeçalho minimalista**:
- Nome do criadouro (serif elegante) à esquerda
- Título do documento + data à direita
- Linha fina dourada (#C9A74A) separando do conteúdo
- Sem selo circular, sem cantos decorativos

A "marca visual" do criadouro passa a vir do **fundo com a logo**, não do header.

## 4. Toggle por chamada — cada gerador escolhe o modo

```ts
// Recibo de empréstimo (1 página, formal): destaque
await applyLogoBackground(doc, profile, 'destaque');

// Plantel (tabelas longas): leitura
await applyLogoBackground(doc, profile, 'leitura');

// Torneio (classificação): leitura
await applyLogoBackground(doc, profile, 'leitura');

// Árvore genealógica (cards visuais): sutil
await applyLogoBackground(doc, profile, 'sutil');
```

## 5. Validador de layout atualizado

`validateLayout` deixa de checar colisão watermark↔header (não há mais faixa verde fixa). Passa a checar:
- Se a logo carregou (avisa se `profile.logo_url` está vazio → fundo fica em branco)
- Se algum `drawTextBackplate` ficaria fora da área útil da página

## 6. Fallback elegante quando não há logo

Se o criadouro não tem `logo_url`, o fundo fica limpo (branco) e o nome do criadouro aparece no header em fonte maior + linha dourada — continua parecendo profissional.

# 📋 Arquivos modificados

- **`src/lib/pdf.ts`** — única alteração:
  - Adicionar `applyLogoBackground(doc, profile, mode)`
  - Adicionar `drawTextBackplate(doc, x, y, w, h, opacity)`
  - Adicionar `drawMinimalHeader(doc, profile, title, subtitle)` (substitui `applyHeaderAllPages`)
  - Remover/deprecar `applyWatermarkAndCorners` e a parte decorativa pesada
  - Atualizar os 4 geradores (`generateLoanReceiptPDF`, `generatePlantelReportPDF`, `gerarRelatorioTorneio`, `generateArvoreGenealogicaPDF`) para usar o novo fluxo + `drawTextBackplate` em volta de tabelas e cards
  - Atualizar `validateLayout`

**Sem mudanças em páginas, sem migrações, sem novas dependências.**

# 🎨 Resultado esperado

- Cada PDF parece **personalizado pelo criadouro** (logo grande no fundo)
- Texto continua **100% legível** graças aos backplates brancos
- Documento mais limpo e moderno (sem o "estilo certificado" pesado)
- Tabelas longas (plantel) ficam confortáveis de ler com fundo quase imperceptível
