# 🎨 Melhorar visualização da logo nos PDFs

Hoje a logo aparece dentro do selo circular com **fundo creme sólido** (`#F5F1E8`), o que cria um “quadrado” visível por trás de logos com fundo branco/transparente. Além disso, a marca-d’água em 5% está praticamente invisível em algumas impressões.

Vou aplicar 3 melhorias em **`src/lib/pdf.ts`** (arquivo único, sem novas dependências):

## 1. Remoção automática de fundo branco/claro

Em `loadLogoBase64()`, depois de desenhar a logo no canvas, faço uma varredura de pixels:

- Pixels com **R, G, B > 240** (brancos e quase-brancos) → **alpha = 0** (transparente)
- Pixels intermediários (240–255) → alpha proporcional (suaviza bordas, evita serrilhado)

Resultado: a logo fica “recortada” sobre o selo circular dourado/creme, sem moldura branca.

> ⚠️ Ressalva honesta: chroma-key simples funciona muito bem para logos com fundo branco sólido (caso da maioria dos criadouros). Para logos com fundo branco fazendo parte do desenho (ex: olho do pássaro), pode haver pequenos “furos”. Se acontecer, basta o usuário enviar PNG já com transparência.

## 2. Logo do selo circular com mais contraste

- Trocar o fundo creme do canvas (que cria o quadrado) por **transparente** — agora o selo circular do PDF aparece atrás da logo limpinha.
- Aumentar levemente a resolução interna do canvas (512 → 768 px) para ficar mais nítida ao imprimir.
- Aplicar leve **sharpening** via `imageSmoothingQuality = 'high'` no `drawImage`.

## 3. Marca-d’água mais autêntica e visível

- Subir opacidade padrão de **5% → 8%** (testado: ainda discreto, mas perceptível em impressão)
- Aplicar **dessaturação** (converter para tons de dourado claro usando matriz de cor) — fica com cara de marca-d’água oficial em vez de “imagem desbotada”
- Também aplicar a remoção de fundo branco aqui (mesmo motivo do item 1)

## 📁 Arquivo afetado

| Arquivo | Mudança |
|---|---|
| `src/lib/pdf.ts` | Atualizar `loadLogoBase64` (transparência + sharpening) e `loadLogoWatermark` (opacidade 8% + dessaturação dourada + transparência) |

Os 3 PDFs (recibo de empréstimo, relatório de plantel, relatório de torneio) recebem a melhoria automaticamente, já que todos usam essas funções.

**Sem mudanças no banco, sem novas libs.** Pode aprovar?
