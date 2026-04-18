
User está em `/grupos/:id/baterias/:bid` e pede 3 coisas:

1. **Ajustar todos os links para convite** — links que apontam para `/grupos/:id/baterias/:bid` ou usam "bateria" devem refletir nova nomenclatura "evento". Notificações ainda mandam pra `/grupos/:id/baterias/:bid` (rota antiga). Provável causa: links de convite/notificação com texto "bateria" ou rotas inconsistentes. Vou padronizar:
   - Manter rota `/grupos/:id/baterias/:bid` (não quebrar URLs antigos) **mas** adicionar alias `/grupos/:id/eventos/:bid`.
   - Ajustar todos os textos de notificação e mensagens para "evento" em vez de "bateria".
   - Verificar `criar_bateria`, `aprovar_inscricao_bateria`, `encerrar_bateria` (RPCs) — geram notificações com "bateria". Atualizar texto.
   - Verificar `EntrarGrupo.tsx`, `ConvidarMembroModal` — links de convite OK, mas confirmar mensagem WhatsApp.

2. **Cada evento poderá ter config diferente; permitir alterar dentro do evento** — hoje `ConfigEliminatoriaModal` existe mas só aparece antes de iniciar. Precisa:
   - Permitir editar formato/durações/corte **a qualquer momento** (admin), com aviso se já tem pontuações.
   - Botão "Editar configuração" sempre visível para admin no `BateriaDetalhe`.
   - Backend: `definir_formato_eliminatoria` já existe — só remover restrição de status se houver, ou ajustar mensagens.

3. **Dentro do evento mostrar participantes** — `BateriaDetalhe` já lista inscrições, mas pelo relato falta uma seção clara "Participantes" mostrando:
   - Nome do criador (não só ave)
   - Ave inscrita + estação
   - Status fase 1 / fase 2
   - Quem foi convidado pelo admin vs quem se inscreveu sozinho

## Plano de implementação

### Backend (1 migration pequena)
- Atualizar textos das notificações nas funções `criar_bateria`, `aprovar_inscricao_bateria`, `encerrar_bateria`: trocar "bateria" → "evento".
- Atualizar `criar_bateria` para gerar link `/grupos/:id/eventos/:bid` (nova rota).
- Garantir que `definir_formato_eliminatoria` permita reconfigurar a qualquer momento (já permite, vou só validar).
- Nova RPC `get_participantes_evento(_bateria_id)` retornando: `inscricao_id, membro_user_id, nome_criador, codigo_criadouro, bird_nome, codigo_anilha, estacao, status, classificado_final, pontos_classif, pontos_final, convidado_pelo_admin` — com join em `criador_profile` (que admin não tem RLS pra ler de outros membros via select direto). Isso resolve o problema de mostrar nomes.

### Frontend

**`src/App.tsx`**
- Adicionar rota alias `/grupos/:id/eventos/:bid` → mesmo componente `BateriaDetalhe` (mantém `/baterias/:bid` funcionando).

**`src/pages/BateriaDetalhe.tsx`**
- Nova seção **"Participantes"** no topo (acima das inscrições atuais), usando a nova RPC, com:
  - Avatar/inicial do criador
  - Nome do criador + código
  - Ave (nome + anilha) + estação
  - Badges: "Convidado pelo admin", "Classificado para final", "Eliminado"
  - Pontos fase 1 / fase 2 (se eliminatória)
- Botão **"Editar configuração do evento"** sempre visível para admin (abre `ConfigEliminatoriaModal`), não só antes de iniciar.
- Aviso visual quando reconfigurar com pontuações já lançadas: "Alterações afetarão eventos futuros. Pontuações atuais são preservadas."

**`src/components/grupos/ConfigEliminatoriaModal.tsx`**
- Permitir abrir mesmo com status `'Em andamento'` ou `'Sorteada'`.
- Mostrar aviso se já tem pontuações registradas.

**`src/pages/GrupoDetalhe.tsx`**
- Trocar links internos `/grupos/:id/baterias/:bid` → `/grupos/:id/eventos/:bid` (UI consistente). Notificações antigas continuam funcionando pelo alias.

**Outros arquivos com "bateria" em links visíveis ao usuário**
- `NotificationBell.tsx` (se renderiza link bruto), mensagens já vêm do banco — atualizadas via migration.

### Resumo
- 1 migration: textos de notificação + nova RPC `get_participantes_evento`
- 1 alias de rota
- Bloco "Participantes" novo em `BateriaDetalhe`
- Botão "Editar configuração" liberado a qualquer momento
- Links internos do app passam a usar `/eventos/`

### Compatibilidade
- URLs antigas `/baterias/:id` continuam funcionando (rota mantida).
- Notificações antigas no banco continuam clicáveis.
- Nenhuma quebra de dados.
