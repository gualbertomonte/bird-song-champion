
# 🐛 Diagnóstico

## 1. Torneio — botão PDF "some"
Em `src/pages/TorneioDetalhe.tsx` linha 100-102, o botão **só aparece** quando `torneio.status === 'Encerrado'`:

```tsx
{torneio.status === 'Encerrado' && (
  <button onClick={baixarPDF} className="btn-ghost text-xs"><Download/> PDF</button>
)}
```

Você está num torneio com status diferente (Rascunho/Inscrições/Sorteado) → por isso não aparece.

## 2. Árvore Genealógica — não existe PDF
O arquivo `src/pages/ArvoreGenealogica.tsx` **não importa nem chama** nenhuma função de `@/lib/pdf`. A funcionalidade nunca foi conectada.

# 🔧 Correções planejadas

## A. Liberar botão PDF do torneio em qualquer status
`src/pages/TorneioDetalhe.tsx` — remover a restrição de status. Mostrar o botão PDF sempre que houver classificação disponível (mesmo durante o torneio, como prévia). Para torneios em `Rascunho` sem classificação, manter desabilitado com tooltip explicativo.

## B. Criar `generateArvoreGenealogicaPDF` em `src/lib/pdf.ts`
Nova função exportada que recebe `(bird, allBirds, profile, generations)` e gera um PDF em **landscape A4** com:
- Papel timbrado completo (mesmo header verde + selo + watermark + cantos dourados + footer já existentes)
- Título "Árvore Genealógica — {nome da ave}"
- Renderização vetorial da árvore (cards de cada ancestral desenhados com `doc.rect`/`doc.text` — sem depender de html2canvas) até a profundidade escolhida (2, 3 ou 4 gerações)
- Cards com: nome, anilha, nome científico, sexo (♂/♀), foto miniatura quando disponível
- Linhas conectoras entre filho ↔ pais
- Marcador "Desconhecido" nos ramos vazios
- Estatística "Ancestrais conhecidos: X / Y" no rodapé do conteúdo
- Validação de layout existente (`validateLayout`)

## C. Adicionar botão "PDF" na página da Árvore
`src/pages/ArvoreGenealogica.tsx` — adicionar botão `Download PDF` ao lado dos controles de zoom, ativo somente quando uma ave está selecionada. Mostra spinner durante geração e usa `toast` para sucesso/erro.

# 📐 Tamanhos ideais de imagem (resposta direta)

Para ficar **excelente no PDF e no perfil**, sigo a regra "2× a maior dimensão de exibição em PDF, formato quadrado, fundo transparente":

| Imagem | Resolução recomendada | Formato | Peso máx. | Por quê |
|---|---|---|---|---|
| **Logo do criadouro** (header + watermark + selo) | **800 × 800 px** quadrada | **PNG transparente** | ~200 KB | O selo no PDF tem 22 mm ≈ 260 px @300 DPI; com 800px sobra resolução para watermark central (que ocupa ~70% da página). PNG preserva alpha — o sistema já remove fundo branco automaticamente, mas transparente nativo fica perfeito. |
| **Foto de perfil do usuário** (avatar) | **400 × 400 px** quadrada | JPG ou PNG | ~150 KB | Avatar é exibido em 32-96px na UI; 400px cobre telas Retina (2-3×) sem desperdício. |
| **Foto da ave** (cards + PDF da árvore) | **600 × 600 px** quadrada (1:1) | JPG (qualidade 85) | ~250 KB | Aparece em miniaturas (40-80px) e em cards maiores (200px). 600px @ JPG 85% dá nitidez no PDF impresso e carrega rápido na lista. |
| **Foto de capa / banner** (se houver) | 1600 × 600 px (proporção 8:3) | JPG (qualidade 85) | ~400 KB | Cobre full-width em desktop sem pixelar. |

**Regras de ouro:**
- ✅ Sempre **quadradas** para logos e avatares (evita corte estranho no selo circular)
- ✅ **PNG com fundo transparente** para a logo (melhor resultado no papel timbrado)
- ✅ **Máximo 1 MB** por upload — o sistema redimensiona, mas arquivos enormes atrasam
- ❌ Evitar logo retangular muito comprida (vira retângulo achatado dentro do círculo dourado)
- ❌ Evitar imagens com texto pequeno (some na watermark a 5%)

# 📋 Arquivos modificados
- `src/lib/pdf.ts` — adicionar `generateArvoreGenealogicaPDF`
- `src/pages/TorneioDetalhe.tsx` — liberar botão PDF
- `src/pages/ArvoreGenealogica.tsx` — adicionar botão PDF + handler

**Sem migrações, sem dependências novas, sem mudanças em outras páginas.**
