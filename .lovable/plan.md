

## Diagnóstico

Investiguei o banco e a causa raiz dos dois sintomas é a **mesma**: a função `createLoan` no frontend tenta INSERIR a "ave clone" no plantel do recebedor usando `user_id = destProfile.user_id`. Mas a RLS da tabela `birds` (`birds_insert_own`) exige `auth.uid() = user_id` — ou seja, o dono **não tem permissão** para criar uma linha em nome de outro usuário. O insert falha silenciosamente (apenas `console.warn`).

**Confirmado no banco**:
- Empréstimo novo da LOIRINHA (id `d92f77c2`, criado 23:48): `borrower_bird_id = NULL` → clone nunca foi criado.
- Plantel do recebedor `96CCCE`: só tem o "fire" (clone antigo, criado antes da RLS atual). Nenhuma LOIRINHA.
- Ave LOIRINHA do dono: marcada como `emprestada_saida` mesmo sem clone do outro lado.

### Sintoma 1 — "aparece como saiu duas"
O dono `04BB49` tem **2 empréstimos ativos** legítimos no banco (fire + LOIRINHA). A aba "Saída" mostra 2 corretamente, mas como a LOIRINHA foi emprestada de novo e o clone não chegou ao recebedor, parece que "saiu duas vezes" sem efeito no destino. O problema é a inconsistência (loan criado mas clone faltando), não duplicação real.

### Sintoma 2 — "recebedor não consegue adicionar a fêmea na nova ninhada"
A LOIRINHA nunca foi inserida no plantel do recebedor (clone falhou por RLS). Por isso ela não aparece no select de fêmeas da Nova Ninhada.

## Plano de correção

### 1. Nova RPC `create_loan` (SECURITY DEFINER) — migration
Substitui a lógica multi-passo do frontend por uma transação atômica no servidor:
- Valida que a ave pertence ao chamador e está com `loan_status='proprio'`.
- Resolve `borrower_user_id` e `borrower_email` via `criador_profile` + `profiles` (já com SECURITY DEFINER, sem depender de RLS).
- Cria o registro em `bird_loans`.
- Marca a ave do dono como `emprestada_saida` com o `loan_id`.
- **Insere o clone no plantel do recebedor** (bypass de RLS porque é SECURITY DEFINER).
- Atualiza `borrower_bird_id` no loan.
- Retorna `loan_id` + dados do destinatário.

Trata edge cases:
- Se já existe clone órfão do recebedor (mesmo `original_bird_id` + `loan_status='emprestada_entrada'`), reaproveita em vez de duplicar.
- Se a anilha da ave já existir no plantel do recebedor com `loan_status='proprio'`, retorna erro claro ("Recebedor já possui ave com essa anilha").

### 2. Reparo de dados existentes (insert tool)
- Para o loan `d92f77c2` (LOIRINHA, atualmente Emprestada, sem clone): criar manualmente o clone no plantel de `b219f742-…` e setar `borrower_bird_id` no loan. Assim o recebedor passa a ter a fêmea disponível imediatamente.

### 3. Frontend (`src/context/AppContext.tsx`)
- Reescrever `createLoan` para chamar `supabase.rpc('create_loan', { … })` em vez de fazer os 5 passos manuais. Mantém: notificação ao recebedor, envio de e-mail, atualização do estado local (`birds`, `loans`).
- Remover o `console.warn` que mascarava o erro de clone — agora qualquer erro retorna ao usuário com toast.

### 4. (Opcional, defesa em profundidade)
Adicionar índice `birds(original_bird_id, loan_status)` para acelerar a limpeza no trigger `ensure_loan_return_cleanup` (já existe).

## Arquivos afetados
- 1 nova migration (função `create_loan` SECURITY DEFINER)
- 1 operação de data-fix via insert tool (cria clone faltante da LOIRINHA + atualiza loan)
- `src/context/AppContext.tsx` (refatora `createLoan` para usar RPC)

## Resultado esperado
- Empréstimos novos criam corretamente o clone no plantel do recebedor.
- Recebedor passa a ver a ave (incl. fêmeas) e pode usá-la em Nova Ninhada.
- Erros de duplicidade ou permissão aparecem como toast claro em vez de "sumir" silenciosamente.

