

## Objetivo
Atualizar a tabela oficial de diâmetros + nomes comuns conforme lista do usuário, e garantir que ao selecionar o nome científico, o **nome comum** e o **diâmetro** sejam preenchidos automaticamente.

## Mapeamento (nome comum → científico → diâmetro)

| Nome comum | Nome científico | Diâmetro |
|---|---|---|
| Trinca-ferro | Saltator similis | 3.5mm |
| Coleiro (Coleirinho) | Sporophila caerulescens | 2.2mm |
| Papa-capim (Baiano) | Sporophila nigricollis | 2.2mm |
| Curió | Sporophila angolensis | 2.6mm |
| Bicudo | Sporophila maximiliani | 3.0mm |
| Canário-da-terra-verdadeiro | Sicalis flaveola | 2.8mm |
| Azulão | Cyanoloxia brissonii | 2.8mm |
| Sabiá-laranjeira | Turdus rufiventris | 4.0mm |
| Cardeal | Paroaria dominicana | 3.5mm |
| Pintassilgo | Spinus magellanicus | 2.5mm |
| Sanhaço-frade | Stephanophorus diadematus | 2.8mm |

> Observação: troco `Carduelis magellanica` → `Spinus magellanicus` (nomenclatura atual). Adiciono Sabiá-laranjeira e Sanhaço-frade que não existiam.

## Mudanças

### 1. `src/data/anilhas.ts`
- Atualizar `DIAMETROS_PADRAO` para incluir `2.2mm` e `2.5mm` (remover os que não estão na lista oficial: 4.5mm, 5.0mm — manter para fallback genérico opcional, mas priorizar os reais).
- Reescrever `DIAMETRO_POR_ESPECIE` com os 11 valores corrigidos acima.
- Adicionar novo export `NOME_COMUM_POR_ESPECIE: Record<string, string>` com os nomes comuns.

### 2. `src/components/NomeCientificoCombobox.tsx`
- Importar `NOME_COMUM_POR_ESPECIE` de `@/data/anilhas` e fazer merge com o `SPECIES_MAP` interno (a fonte oficial passa a ser `anilhas.ts`; o map local vira fallback/legado).
- Garantir que `select(name)` continue chamando `onNomeComumChange` com o nome comum oficial — já faz isso.

### 3. `src/pages/Plantel.tsx`
- O `useEffect` que sugere diâmetro já existe — só precisa ler o mapa atualizado (sem mudança de código).
- Adicionar (se ainda não há) lógica que, ao selecionar nome científico, também preenche `nome_comum_especie` automaticamente. O `NomeCientificoCombobox` já expõe `onNomeComumChange` — confirmar que o parent passa essa prop e atualiza o estado.

## Arquivos afetados
- `src/data/anilhas.ts` (atualizar diâmetros + adicionar mapa de nomes comuns)
- `src/components/NomeCientificoCombobox.tsx` (consumir nomes comuns oficiais)
- `src/pages/Plantel.tsx` (verificar/garantir que `onNomeComumChange` está conectado ao form)

## Resultado esperado
Selecionar "Sporophila angolensis" no combobox → nome comum "Curió" e diâmetro "2.6mm" aparecem automaticamente nos respectivos campos, com possibilidade de override manual.

