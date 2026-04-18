
User pediu 4 melhorias no contexto de eventos/grupos:

1. **Layout responsivo total** — revisar todas as páginas/modais de grupos e eventos para mobile/tablet/desktop.
2. **Admin adiciona participante; participante só escolhe ave** — admin convida membro pro evento (já existe via `convidar_membros_evento`, mas hoje cria com bird placeholder). Precisa criar fluxo onde o convidado vê notificação "você foi adicionado ao evento X, escolha sua ave" e seleciona uma de suas aves cadastradas.
3. **Membro pede para participar do evento; admin aceita/rejeita** — fluxo de auto-inscrição já existe (`inscrever_ave_bateria`) que cria status 'Pendente'. Falta UI clara: botão "Pedir para participar" pro membro + tela de aprovação destacada pro admin com aceitar/rejeitar.
4. **Admin pode promover outros membros a admin do grupo** — hoje grupo tem 1 só `admin_user_id`. Precisa usar `papel='admin'` na tabela `torneio_grupo_membros` e atualizar funções `is_grupo_admin` para aceitar qualquer membro com papel admin.

## Plano

### Backend (1 migration)

**Mudança de modelo de admin (item 4):**
- Atualizar `is_grupo_admin(_grupo_id)` para retornar true se `admin_user_id = auth.uid()` **OU** existir membro ativo com `papel='admin'`. Mantém compatibilidade.
- Nova RPC `promover_membro_admin(_grupo_id, _user_id)` — só admin original ou outro admin pode chamar; faz UPDATE em `torneio_grupo_membros.papel='admin'` + notificação.
- Nova RPC `rebaixar_membro_admin(_grupo_id, _user_id)` — só admin original (`admin_user_id`) pode rebaixar; impede rebaixar a si mesmo se for o último admin.

**Inscrição pendente para participantes adicionados pelo admin (item 2):**
- Nova RPC `convidar_membros_evento_pendente(_bateria_id, _user_ids[])` — cria inscrições com status `'PendenteAve'` (novo status) + `convidado_pelo_admin=true`, **sem bird_id** (alterar coluna `bird_id` para nullable). Notifica cada convidado: "Você foi adicionado ao evento X. Escolha sua ave."
- Nova RPC `escolher_ave_inscricao(_inscricao_id, _bird_id)` — convidado seleciona ave dele, valida ownership/sexo, atualiza `bird_id` + `bird_snapshot` + status passa para `'Pendente'` (vai pra fila de aprovação do admin) ou direto `'Aprovada'` se foi convite do admin (decisão: vai direto pra Aprovada para reduzir fricção, já que o admin já o convidou).
- Migration: `ALTER TABLE bateria_inscricoes ALTER COLUMN bird_id DROP NOT NULL;`

**Auto-inscrição (item 3) — ajustes:**
- `inscrever_ave_bateria` já existe e cria status 'Pendente'. Adicionar notificação automática para o admin do grupo: "Fulano pediu para participar do evento X". Já está funcional, só falta a notificação.

### Frontend

**Item 1 — Responsividade:**
- `BateriaDetalhe.tsx`: container já é fluid; revisar grids de admin tools, ações de fase, lista de participantes — empilhar em mobile, 2 colunas em md+.
- `ParticipantesEvento.tsx`: card layout vira lista vertical em mobile.
- `ConfigEliminatoriaModal.tsx` / `SelecionarParticipantesModal.tsx`: bottom-sheet em mobile, dialog centralizado em md+.
- `GrupoDetalhe.tsx`: header de ações (compartilhar, convidar, novo evento) vira menu colapsado em mobile.
- `PontuarBateria.tsx`: já é mobile-first; garantir que funcione bem em tablet/desktop (limitar largura, centralizar).

**Item 2 — Convidado escolhe ave:**
- Atualizar `SelecionarParticipantesModal` para chamar a nova RPC `convidar_membros_evento_pendente`.
- Novo componente `EscolherAveInscricaoModal.tsx` — abre via notificação, lista as aves do usuário (machos), botão "Confirmar".
- `BateriaDetalhe.tsx`: se houver inscrição própria com status `'PendenteAve'`, mostrar banner amarelo "Escolha sua ave para participar" com CTA.

**Item 3 — Pedido de participação:**
- `BateriaDetalhe.tsx`: para membros não inscritos com evento em status `'Inscricoes'`, mostrar botão grande "Pedir para participar" → abre seletor de ave do usuário → chama `inscrever_ave_bateria`.
- Nova seção destacada para admin: "Pedidos pendentes" no topo de Participantes, com botões Aprovar/Rejeitar inline (já existem RPCs `aprovar_inscricao_bateria`).

**Item 4 — Co-admins:**
- `GrupoDetalhe.tsx` aba "Membros": badge "Admin" para quem tem `papel='admin'`. Para o admin original, botão de menu por membro: "Promover a admin" / "Remover admin".
- `ParticipantesEvento.tsx` (não muda, só aproveita).

### Resumo de arquivos

- Migration: nova com itens 2–4 (atualiza `is_grupo_admin`, novas RPCs, ajuste de coluna).
- `src/types/grupo.ts`: novo status `'PendenteAve'` + tipo `bird_id: string | null`.
- `src/pages/BateriaDetalhe.tsx`: banner de escolha de ave + botão "Pedir para participar" + responsividade.
- `src/pages/GrupoDetalhe.tsx`: aba Membros com promover/rebaixar admin + responsividade.
- `src/components/grupos/SelecionarParticipantesModal.tsx`: chamar nova RPC pendente.
- `src/components/grupos/ParticipantesEvento.tsx`: mostrar status PendenteAve + responsividade.
- `src/components/grupos/EscolherAveInscricaoModal.tsx` (novo).
- `src/components/grupos/PedirParticiparEventoModal.tsx` (novo).

### Compatibilidade

- Inscrições antigas (com bird_id) não são afetadas.
- Admin original (`admin_user_id` em `torneio_grupos`) continua sendo "super admin" — só ele pode rebaixar outros admins e excluir o grupo.
