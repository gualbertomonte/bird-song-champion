# 🖼️ Corrigir papel timbrado nos PDFs

Analisei a imagem que você enviou (a árvore com o pássaro de fundo em transparência ficou linda 👌) e vou aplicar esse mesmo conceito visual nos PDFs, junto com a correção do bug do logo que não aparece.

## 🐛 Por que o logo não está aparecendo hoje

O `fetch()` que baixa o logo do Storage está falhando por **CORS** — o navegador cacheou a imagem antes sem os headers corretos, então quando tento converter em base64 dá erro silencioso e o PDF sai sem logo.

## ✅ O que vou fazer

### 1. Corrigir o carregamento do logo (`src/lib/pdf.ts`)

- Trocar `fetch()` por **`HTMLImageElement` + `<canvas>`** com `crossOrigin = 'anonymous'` (método mais robusto, funciona mesmo com cache antigo).
- Adicionar `?v=timestamp` no URL do logo pra **forçar bypass do cache** corrompido.
- Adicionar `console.warn` claro caso falhe (pra debug futuro).
- Fallback: se mesmo assim falhar, usa um **ícone dourado de pássaro desenhado no próprio PDF** (sem depender de imagem externa).

### 2. Estilo "papel timbrado" autêntico (inspirado na sua árvore)

- **Selo circular dourado** maior (22mm) com sombra suave e borda dupla — fica com cara de carimbo oficial.
- **Marca d'água do logo** no centro de cada página, opacidade 4%, atrás do conteúdo (igual à árvore que você mandou).
- **Faixa verde-floresta** no topo + **filete dourado** duplo separando do corpo.
- **Rodapé** com nome do criadouro + código + paginação, separado por filete dourado.
- **Cantos decorativos** dourados discretos (estilo certificado).

### 3. Aplicar nos 3 PDFs existentes

- Recibo de empréstimo
- Relatório de plantel
- Relatório de torneio

(O `await header()` já está correto desde a última implementação, só precisa funcionar de fato.)

## 📁 Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/lib/pdf.ts` | Reescrever `loadLogoBase64` + cabeçalho timbrado + marca d'água + cantos |

**Apenas 1 arquivo.** Sem mudanças no banco, sem novas dependências.

---

Pode aprovar? Depois de aplicar, você gera qualquer PDF e me manda print pra confirmarmos o resultado. 👍
