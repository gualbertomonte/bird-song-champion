

## Diagnóstico

Bug confirmado no banco: a ave **LOIRINHA** (do dono `04BB49`) ficou com `loan_status='emprestada_saida'` mesmo com o empréstimo já marcado como `Devolvida`. O `borrower_bird_id` desse loan está NULL — por isso a função `confirm_loan_return` atual tem um fallback (`DELETE WHERE original_bird_id = ...`), mas em algum momento anterior a devolução foi feita por um caminho que NÃO restaurou o dono. Resultado:

- No Plantel: aparece o badge "Emprestada para outro criador"
- Em Empréstimos → Novo: a ave não aparece no select (filtro `loan_status === 'proprio'`)

## Causa raiz (duas frentes)

1. **Dado órfão no banco**: 1 loan já fechado deixou a ave do dono não restaurada. Precisa ser corrigido pontualmente.
2. **Robustez da função `confirm_loan_return`**: hoje ela já restaura, mas não tem proteção contra reentrância nem contra estados inconsistentes anteriores. Vou tornar idempotente e adicionar uma "limpeza" automática.

## Plano de correção

### 1. Reparar dados existentes (UPDATE/DELETE via tool de insert)
Para cada loan com `status='Devolvida'`:
- Restaurar a ave original do dono: `loan_status='proprio'`, `loan_id=NULL`
- Remover qualquer clone órfão do recebedor (`loan_status='emprestada_entrada'` apontando para esse `original_bird_id`)

### 2. Endurecer `confirm_loan_return` e `cancel_loan` (nova migration)
- Marcar como `IDEMPOTENT`: se o loan já estiver `Devolvida`, ainda assim garantir a restauração da ave do dono e a limpeza de clones órfãos do recebedor (não falhar).
- Sempre restaurar `loan_status='proprio'` e `loan_id=NULL` na ave original, independente do estado anterior.
- Sempre apagar clones do recebedor por `original_bird_id` + `loan_status='emprestada_entrada'`, não apenas pelo `borrower_bird_id`.

### 3. Trigger de segurança (defesa em profundidade)
Criar um trigger `AFTER UPDATE` em `bird_loans`: quando `status` muda para `Devolvida`, garantir que a ave do dono seja restaurada e clones do recebedor removidos. Isso fecha qualquer caminho futuro que esqueça de fazer isso.

### 4. Frontend
- Em `confirmLoanReturn` (AppContext): após o RPC, atualizar localmente também a ave do dono no `setBirdsState` para refletir `loan_status='proprio'` (hoje só remove o clone do recebedor; o dono só vê a mudança após reload).
- Nada muda em `Plantel.tsx` ou `Emprestimos.tsx` — os filtros já estão corretos.

### Arquivos afetados
- 1 migration nova (função idempotente + trigger)
- 1 operação de data-fix (insert tool: UPDATE/DELETE)
- `src/context/AppContext.tsx` (atualização do estado local após devolução)

