
# 🎨 Logo do Criadouro como Papel Timbrado

Vou usar o logo que o usuário já envia em **Perfil → Logo do Criadouro** (`criador_profile.logo_url`) como identidade visual em três lugares: PDFs, crachás digitais e árvore genealógica. Também vou melhorar a UX do upload pra deixar claro pra que serve.

---

## 1. 📄 PDFs com cabeçalho timbrado (`src/lib/pdf.ts`)

- Tornar a função `header()` **assíncrona** pra buscar o `logo_url` e converter em base64 (necessário pro `jsPDF.addImage`).
- Renderizar o logo como **selo circular (~18mm)** dentro da faixa verde do cabeçalho, à esquerda, com o texto "MeuPlantelPro" e o nome do criadouro deslocados pra direita.
- Adicionar o nome do criadouro no rodapé de cada página (texto pequeno, discreto).
- **Cache em memória** do logo convertido pra não baixar/converter a cada página do PDF.
- **Fallback**: se não houver logo, mantém o layout atual (ícone dourado de pássaro).
- Propagar o `await` para os geradores de relatório que chamam `header()`:
  - `src/pages/Plantel.tsx`
  - `src/pages/Emprestimos.tsx`
  - Qualquer outro consumidor encontrado (vou rodar `rg "header\("` antes de aplicar).

## 2. 🪪 Crachá digital da ave (`src/pages/BirdDetail.tsx`)

- Substituir o ícone genérico de pássaro no canto superior esquerdo do crachá pelo **logo do criadouro** (com fallback pro ícone dourado se não tiver logo).
- Usar `crossOrigin="anonymous"` no `<img>` pra garantir que o `html-to-image` consiga capturar a imagem na hora de exportar PNG.
- Adicionar pequeno texto "Criado por: {nome_criadouro}" próximo ao logo.

## 3. 🌳 Árvore genealógica (`src/pages/ArvoreGenealogica.tsx`)

- **Marca d'água sutil** do logo no fundo (`opacity-[0.05]`, centralizado, atrás dos nós da árvore).
- **Rodapé discreto** com logo pequeno + nome do criadouro embaixo da árvore.
- Botão **"Exportar PNG"** usando `html-to-image` pra gerar uma imagem da árvore inteira já com a marca d'água e o rodapé (útil pro usuário compartilhar).

## 4. 🪝 Hook compartilhado (`src/hooks/useCriadorLogo.ts`)

- Novo hook que lê `criador_profile.logo_url` e `nome_criadouro` uma vez e compartilha via React Query (cache automático).
- Usado pelos 3 features acima e pelos PDFs (via função utilitária no `pdf.ts`).

## 5. 💬 **Comunicar a função ao usuário no upload** (`src/pages/Perfil.tsx`)

Esta é a parte que você pediu. Vou ajustar o card "Logo do Criadouro" assim:

- **Texto explicativo** abaixo do título, antes do botão de upload:
  > "📄 Esta logo será usada como **papel timbrado** em todos os PDFs gerados (relatórios, fichas de aves, comprovantes de empréstimo), nos **crachás digitais** das suas aves e como **marca d'água** na árvore genealógica. Use uma imagem de boa qualidade, preferencialmente quadrada e com fundo transparente (PNG)."
- **Após upload concluído** com sucesso, mostrar um **toast** confirmando:
  > "✅ Logo salva! Será usada nos seus PDFs, crachás e árvore genealógica."
- **Recomendações visuais** discretas abaixo do botão:
  - Formato: PNG ou JPG
  - Tamanho ideal: 512×512px
  - Fundo transparente recomendado (PNG)
- **Preview maior** (já existe um preview pequeno de 80×80; vou manter, mas adicionar uma legenda "Pré-visualização").

---

## 📁 Arquivos afetados

| Arquivo | Tipo de mudança |
|---|---|
| `src/lib/pdf.ts` | `header()` async + carrega logo + rodapé |
| `src/hooks/useCriadorLogo.ts` | **novo** — hook compartilhado |
| `src/pages/Perfil.tsx` | textos explicativos + toast informativo |
| `src/pages/BirdDetail.tsx` | logo no crachá |
| `src/pages/ArvoreGenealogica.tsx` | marca d'água + rodapé + exportar PNG |
| `src/pages/Plantel.tsx` | `await` nas chamadas de PDF |
| `src/pages/Emprestimos.tsx` | `await` nas chamadas de PDF |

**Sem mudanças no banco** — `criador_profile.logo_url` e o bucket `bird-photos` já existem e funcionam.

---

Pode aprovar que eu implemento tudo de uma vez? 👍
