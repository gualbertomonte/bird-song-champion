

## Objetivo
Melhorar o formulário de cadastro/edição de aves no `Plantel.tsx` (e onde aplicável) com regras de validação e automações baseadas na tabela oficial de anilhas da Federação dos Criadores.

## Investigação rápida
Preciso confirmar a estrutura atual do form e a tabela oficial de diâmetros por espécie.

### Tabela de diâmetros (Federação dos Criadores — referência)
Vou embutir um mapa `ESPECIE → DIAMETRO` no código com as principais espécies já presentes em `NomeCientificoCombobox.tsx` (Curió, Bicudo, Trinca-ferro, Coleirinho, Azulão, Cardeal, Pintassilgo, Canário, Canário-da-terra, Pixoxó, Chorão, Baiano). Diâmetros comuns: 2,4mm / 2,6mm / 2,8mm / 3,0mm / 3,5mm / 4,0mm conforme espécie. Vou consultar a página oficial para garantir exatidão antes de implementar.

## Mudanças propostas

### 1. Código de anilha — somente números, ~6 dígitos
- Input com `inputMode="numeric"`, `pattern="[0-9]*"`, `maxLength={6}`.
- Validação ao salvar: se preenchido, deve conter apenas dígitos (1–6). Toast de erro caso contrário.
- Filtra entrada em tempo real (`replace(/\D/g, '')`).

### 2. Anilha SISPASS — Sim/Não
- Nova coluna `birds.anilha_sispass boolean default false` (migration).
- Adicionar `RadioGroup` "Anilha SISPASS?" com Sim/Não no form.
- Refletir em `Bird` type e mapeamento no `AppContext`.

### 3 + 4. Diâmetros auto-selecionáveis vinculados à espécie
- Criar `src/data/anilhas.ts` exportando:
  - `DIAMETROS_PADRAO: string[]` (lista completa para fallback no select)
  - `DIAMETRO_POR_ESPECIE: Record<string, string>` (chave = nome científico)
- Substituir o input de texto de `diametro_anilha` por um `<Select>` populado com `DIAMETROS_PADRAO`.
- Ao mudar `nome_cientifico` (via `NomeCientificoCombobox`), se `DIAMETRO_POR_ESPECIE[nome]` existir e o usuário ainda não escolheu manualmente, preencher automaticamente. (Adicionar callback `onDiametroSugerido` no combobox OU lógica no parent via `useEffect` observando `nome_cientifico`.)
- Mostrar dica visual quando o diâmetro foi auto-preenchido ("Sugerido pela federação — você pode alterar").

### 5. Renomear label "Estado (UF)" → "Estado do SISPASS (UF)"
- Apenas troca de label nos forms (`Plantel.tsx`, e onde mais aparecer). Sem mudança de coluna no banco.

### 6. Renomear label "Nome" → "Nome (apelido)"
- Apenas troca de label nos forms. Sem mudança de coluna.

## Arquivos afetados
- 1 migration (coluna `anilha_sispass`)
- `src/data/anilhas.ts` (novo — tabela de diâmetros oficiais)
- `src/types/bird.ts` (campo `anilha_sispass?: boolean`)
- `src/context/AppContext.tsx` (mapear nova coluna)
- `src/pages/Plantel.tsx` (form: validação numérica do código, radio SISPASS, select de diâmetro com auto-preenchimento, novos labels)
- `src/components/NomeCientificoCombobox.tsx` (opcional: emitir callback com diâmetro sugerido) — ou tratar via `useEffect` no parent
- `src/integrations/supabase/types.ts` (auto-atualiza)

## Validação antes de implementar
Vou abrir a página da Federação para confirmar os diâmetros oficiais por espécie e ajustar o mapa antes de codar.

## Resultado esperado
- Código de anilha aceita apenas números (até 6 dígitos).
- Pergunta SISPASS clara como Sim/Não.
- Diâmetro vira select com opções padronizadas e auto-preenche conforme a espécie escolhida (com possibilidade de override manual).
- Labels mais claros e alinhados ao vocabulário do criador.

