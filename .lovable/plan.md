

## Plano

### 1. Filhotes do berçário — bloquear edição manual de parentesco

**Marcador:** adicionar coluna `birds.gerado_no_bercario boolean default false`. O `Bercario.tsx` (função `registrarEclosao`) passa a inserir os filhotes com `gerado_no_bercario = true` (além de `pai_id`/`mae_id` que já preenche). Filhotes antigos cuja origem é o berçário podem ser detectados por `nests.quantidade_filhotes > 0` + filhos referenciando esse casal — vou rodar um data-fix marcando como `true` qualquer ave cujo `(pai_id, mae_id)` corresponda a um `nest` com `status='Eclodida'` do mesmo `user_id`.

**UI (`Plantel.tsx` form de edição):** quando `editId` corresponde a uma ave com `gerado_no_bercario=true`, os selects de **Pai** e **Mãe** ficam `disabled` com aviso "Parentesco definido pelo berçário e não pode ser alterado." Os outros campos continuam editáveis.

**Defesa em backend:** trigger `BEFORE UPDATE` em `birds` que rejeita alteração de `pai_id`/`mae_id` quando `OLD.gerado_no_bercario = true` (mensagem clara). Garante que mesmo via API direta o vínculo é preservado.

### 2. Transferência de ave — por e-mail OU código de criadouro

**UI (`BirdDetail.tsx`, modal "Transferir Ave"):**
- Manter um único campo de input "E-mail ou Código do Criadouro", com texto auxiliar explicando ambas as opções.
- Detecção automática: se contém `@` → trata como e-mail; senão → trata como código (uppercase, trim).

**Backend — nova RPC `transfer_bird(_bird_id uuid, _destinatario text)` (SECURITY DEFINER):**
- Valida que o chamador é dono e que `loan_status='proprio'`.
- Se `_destinatario` contém `@`: usa como `recipient_email` (mantém fluxo atual via `pending_transfers`, recebedor reclama no próximo login).
- Se não contém `@`: faz lookup em `criador_profile.codigo_criadouro` → pega `user_id` → pega `email` em `profiles`. Se não achar, erro "Código de criadouro não encontrado". Usa esse e-mail como `recipient_email`.
- Insere em `pending_transfers` com `recipient_email`, `bird_data` (snapshot), `sender_email`, `transferido_por_user_id`.
- Remove a ave do plantel do remetente (`DELETE FROM birds WHERE id = _bird_id`).
- Retorna `{ recipient_email, recipient_nome }` para o frontend exibir confirmação clara.

**Frontend `handleTransfer`:** substitui o insert direto + `deleteBird` por uma única chamada `supabase.rpc('transfer_bird', ...)`. Em seguida dispara `send-transfer-email` (não-bloqueante) com o e-mail retornado pela RPC. Toast de sucesso mostra para quem foi (e-mail + nome do criadouro quando código foi usado).

### Arquivos afetados
- 1 migration: coluna `gerado_no_bercario`, trigger de proteção, RPC `transfer_bird`
- 1 data-fix (insert tool): marcar filhotes existentes do berçário como `gerado_no_bercario=true`
- `src/pages/Bercario.tsx` (passar `gerado_no_bercario:true` ao criar filhotes)
- `src/pages/Plantel.tsx` (desabilitar selects de pai/mãe quando aplicável)
- `src/pages/BirdDetail.tsx` (campo único e-mail/código + chamada à RPC)
- `src/types/bird.ts` (campo opcional `gerado_no_bercario?: boolean`)
- `src/context/AppContext.tsx` (mapear coluna nova nos rows)

### Resultado esperado
- Filhotes nascidos no berçário têm pai/mãe travados na UI e no banco — vínculo genealógico íntegro.
- Transferência aceita e-mail diretamente OU código de criadouro (resolve internamente para e-mail), com mensagem de sucesso clara em ambos os casos.

