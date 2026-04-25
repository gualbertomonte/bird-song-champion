
# 🐛 Diagnóstico

Consigo ver o PDF que você mandou. **O papel timbrado está parcialmente aplicado**, mas com um bug crítico:

| Elemento | Status no seu PDF |
|---|---|
| ✅ Cantos dourados decorativos (4 cantos) | Aparecendo |
| ✅ Marca-d'água central | Aparecendo (mancha no meio da tabela) |
| ✅ Rodapé com filete dourado | Aparecendo |
| ❌ **Faixa verde-floresta no topo** | **SUMIU** |
| ❌ **Selo circular dourado com logo** | **SUMIU** |
| ❌ **Nome do criadouro + código** | **SUMIU** |

## 🎯 Causa raiz

Em `src/lib/pdf.ts`, a função `applyWatermarkAndCorners` é chamada **depois** do conteúdo e desenha a marca-d'água como uma imagem PNG de ~55% da página, centralizada. O problema: `doc.addImage()` do jsPDF, mesmo com PNG transparente, em muitos viewers **renderiza um retângulo branco opaco** que encobre qualquer coisa desenhada antes (faixas, círculos, texto). Como o cabeçalho verde está no topo (y=0 a y=30) e a marca-d'água ocupa do centro pra fora, a interseção apaga parte do header.

Pior: pelo screenshot dá pra ver que **o header inteiro sumiu**, o que sugere que a watermark está sendo desenhada em tela cheia ou que há um bug adicional no cálculo de tamanho em landscape.

# 🔧 Correção planejada

**Arquivo único: `src/lib/pdf.ts`**

## 1. Reordenar a renderização (correção principal)
Mudar a ordem em `generateLoanReceiptPDF`, `generatePlantelReportPDF` e `gerarRelatorioTorneio` para:

1. **Primeiro**: aplicar marca-d'água + cantos (vai pro fundo)
2. **Depois**: re-desenhar header em todas as páginas
3. **Por último**: rodapé

Hoje está: conteúdo → header (só pág 1) → watermark (cobre header) → footer.

## 2. Restringir a marca-d'água à área de conteúdo
Limitar a watermark para começar abaixo do header (a partir de y=55) e parar antes do footer (y=h-20), em vez de ocupar a página inteira centralizada. Assim ela nunca toca o cabeçalho verde nem o rodapé.

## 3. Aplicar header em TODAS as páginas
Hoje o `header()` só roda na página 1. Em relatórios de plantel/torneio com várias páginas, da página 2 em diante não tem cabeçalho. Vou criar um `applyHeaderAllPages()` que itera com `doc.setPage(i)`.

## 4. Reduzir a opacidade da watermark de volta para 5%
A 8% ela está visível demais e "embaçando" a leitura da tabela (dá pra ver na sua imagem que a célula central do meio fica com fundo levemente acinzentado). 5% fica mais elegante e autêntico.

## 5. Garantir compatibilidade do PNG transparente
Trocar o `'FAST'` no `addImage` da watermark por `'SLOW'` (compressão sem perdas, melhor preservação do alpha) e usar `'NONE'` no parâmetro de compressão para o canal alpha não ser quantizado.

# 📋 Resultado esperado

Depois da correção, todos os 3 PDFs (recibo, plantel, torneio) terão:

- ✅ Faixa verde-floresta de 30mm no topo de **todas as páginas**
- ✅ Selo circular dourado com a logo do criadouro (com fundo já removido)
- ✅ Nome do criadouro + código + CTF/CPF no header
- ✅ Selo "MEUPLANTELPRO · Plantel Premium" à direita
- ✅ Marca-d'água sutil a 5% APENAS na área de conteúdo (não tocando header/footer)
- ✅ Cantos dourados decorativos em todas as páginas
- ✅ Rodapé com filete duplo + créditos + paginação

**Sem novas dependências, sem mudanças no banco.** Apenas refatoração de `src/lib/pdf.ts`.
