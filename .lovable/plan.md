

## Problema

Hoje "Registrar Eclosão" assume que todos os ovos eclodem juntos: marca o ninho como `Eclodida` e cria todos os filhotes de uma vez. Na prática, filhotes nascem em dias diferentes e alguns ovos podem nem eclodir.

## Solução: eclosão parcial / incremental

Permitir registrar eclosões aos poucos enquanto o ninho continua "Incubando" até o criador encerrar.

### Mudanças no modelo (`Nest`)

Adicionar campos derivados/contadores:
- `quantidade_eclodidos` (int) — soma de filhotes já registrados
- `quantidade_nao_eclodidos` (int, opcional) — ovos descartados ao encerrar
- Status passa a ter um estado intermediário: `'Incubando' | 'Eclosao Parcial' | 'Eclodida' | 'Encerrada' | 'Perdida'`

Não precisa migração de banco — `nests.status` já é text livre e podemos guardar `quantidade_eclodidos` derivando de `birds` (filhos com `mae_id`+`pai_id`+`gerado_no_bercario` cuja `data_nascimento >= data_postura`). Para simplicidade e performance, derivamos na hora (sem nova coluna).

### Fluxo novo no card "Incubando"

Cada ninho mostra:
```
Mãe × Pai
3/5 eclodidos · postura 10/04 · prev. 24/04
[+ Registrar nascimento]  [Encerrar ninhada]
```

- **+ Registrar nascimento**: abre `EclosaoParcialModal` (versão simplificada do atual) que pede só os filhotes nascidos HOJE (default 1 linha), com mesma UI de anilha/sexo/diâmetro. Ao confirmar:
  - cria os filhotes (status `Berçário`, `data_nascimento` = data informada — default hoje)
  - **não** muda status do ninho para `Eclodida`; muda para `'Eclosao Parcial'` se ainda houver ovos pendentes (`eclodidos < quantidade_ovos`)
  - se `eclodidos === quantidade_ovos` → marca `Eclodida` automaticamente, define `data_eclosao` = hoje
- **Encerrar ninhada**: confirma que os ovos restantes não vão eclodir. Marca status `Encerrada`, define `quantidade_filhotes` = total registrado.

### Componentes a alterar/criar

1. **`EclosaoParcialModal.tsx`** (novo) — substitui o uso atual de `EclosaoLoteModal` no fluxo de eclosão parcial. Permite:
   - escolher data de nascimento (default hoje)
   - adicionar 1..N filhotes nascidos nesse evento
   - mostra contador "já nasceram X de Y ovos"
2. **`Bercario.tsx`** — atualiza card "Incubando":
   - mostra progresso `eclodidos/total`
   - botão "+ Registrar nascimento" e "Encerrar"
   - inclui ninhos com status `'Incubando'` E `'Eclosao Parcial'` na lista
3. **`AppContext.tsx`** — adicionar helper `getEclodidosCount(nestId)` (filtra `birds` por `mae_id/pai_id` do ninho com `gerado_no_bercario` e `data_nascimento >= data_postura`). Atualizar `confirmarEclosao` para suportar registro incremental.
4. **`CalendarioEclosoes.tsx`** — incluir ninhos `'Eclosao Parcial'` mostrando "X de Y já nasceram".
5. **`DesempenhoCasais.tsx`** — usar contagem real de filhotes registrados (não só `quantidade_filhotes` final).
6. **`EclosaoLoteModal.tsx`** — manter como fallback / opção "registrar todos de uma vez" (mantém compatibilidade), ou aposentar — proposta: **manter** acessível via menu "Registrar todos de uma vez" para quem prefere o fluxo antigo.

### Diagrama de estados

```text
Incubando ──+nascimento──> Eclosao Parcial ──+nascimento──> Eclodida (todos)
    │                            │
    └──Encerrar──> Encerrada     └──Encerrar──> Encerrada
    └──Perdida (manual)
```

### Detalhes técnicos

- **Sem migração de banco** (status é text). Apenas adiciono os novos valores no enum TS de `Nest['status']`.
- **Contagem de eclodidos**: derivada de `birds.filter(b => b.mae_id===n.femea_id && b.pai_id===n.macho_id && b.gerado_no_bercario && b.data_nascimento >= n.data_postura && (!n.data_eclosao_final || b.data_nascimento <= n.data_eclosao_final))`. Para evitar misturar ninhadas diferentes do mesmo casal, filtro por janela: `data_postura <= data_nascimento <= data_postura + 30d`.
- **UI Plantel**: filhotes em "Berçário" continuam aparecendo no card "Filhotes Recentes" sem mudança.

### Arquivos tocados

- `src/types/bird.ts` (+2 valores em status)
- `src/components/bercario/EclosaoParcialModal.tsx` (novo)
- `src/pages/Bercario.tsx` (UI card incubando + handlers)
- `src/components/bercario/CalendarioEclosoes.tsx` (mostrar parcial)
- `src/components/bercario/DesempenhoCasais.tsx` (usar contagem real)

