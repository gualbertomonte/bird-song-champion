

## Torneios Multi-Usuário — plano aprovado

Decisões confirmadas: manter atual como "Histórico de Participações" · múltiplas baterias com soma · organizador escolhe entre link aberto OU convite por e-mail.

### 1. Banco (migration)

**Tabelas (todas com RLS):**
- `torneios` — `id, organizer_user_id, nome, data, regulamento, numero_estacoes int, numero_baterias int default 1, status` ('Rascunho'|'Inscricoes'|'Sorteado'|'Em andamento'|'Encerrado'), `created_at, encerrado_em`.
- `torneio_convites` — `id, torneio_id, tipo` ('email'|'link_aberto'), `email_convidado` (nullable), `token uuid unique, status, accepted_user_id`.
- `torneio_participantes` — `id, torneio_id, user_id`, unique(torneio_id,user_id).
- `torneio_inscricoes` — `id, torneio_id, participante_user_id, bird_id, bird_snapshot jsonb, status` ('Pendente'|'Aprovada'|'Rejeitada'), `motivo_rejeicao, estacao int`.
- `torneio_pontuacoes` — `id, torneio_id, inscricao_id, bateria int, pontos numeric, created_by_user_id, created_at`.
- `torneio_audit_log` — preenchido por trigger em `torneio_pontuacoes`.

**RPCs SECURITY DEFINER:**
- `aceitar_convite_torneio(_token)` — valida e-mail se tipo='email'; aceita qualquer logado se 'link_aberto' até atingir nº estações.
- `inscrever_ave_torneio(_torneio_id,_bird_id)` — valida ownership + cria snapshot.
- `aprovar_inscricao(_inscricao_id,_aprovar,_motivo)` — só organizador.
- `sortear_estacoes(_torneio_id)` — server-side `random()`, só organizador, refazível antes de "Em andamento".
- `registrar_pontuacao(_inscricao_id,_bateria,_pontos)` — só organizador, bloqueia se Encerrado.
- `encerrar_torneio(_torneio_id)`.

**Realtime:** publicar `torneio_pontuacoes` e `torneio_inscricoes`.

**RLS-chave:** `birds` intocada → organizador nunca edita aves alheias. INSERT/UPDATE de pontuação e estação só via RPC.

### 2. Edge Functions

- `enviar-convite-torneio` — cria convites + dispara e-mails (template app email) + retorna link WhatsApp.
- `notificar-evento-torneio` — cria `notifications` e dispara e-mails para: aprovação, sorteio, pontuação atualizada, encerramento.

Usa infraestrutura de **app emails** built-in (precisa setup de domínio se ainda não houver — será feito no fluxo).

### 3. Frontend (tema Aviário Premium já aplicado)

- `/torneios` (NOVO) — lista de torneios colaborativos (organizador/participante, filtro por status).
- `/torneios/novo` — wizard: nome · data · nº estações · nº baterias · regulamento · convites (escolha link aberto OU e-mails).
- `/torneios/:id` — abas: Visão Geral · Inscrições (organizador aprova) · Sorteio (tabela Estação→Ave, botão "Refazer") · Pontuação (organizador, grid bateria×ave) · Classificação (realtime, badges 🥇🥈🥉, destaque dourado em "minha ave") · Auditoria (organizador).
- `/torneio/convite/:token` — página pública: chama RPC se logado, senão redireciona p/ `/login?redirect=...`.
- `/historico-torneios` — atual `Torneios.tsx` renomeado (zero quebra).
- Menu lateral: "Torneios" (novo) + "Histórico" (antigo).

### 4. PDF

`src/lib/pdf.ts` ganha `gerarRelatorioTorneio(torneio, classificacao, criador)` — capa + regulamento + tabela classificação final + rodapé Plantel Pro+. Botão "Baixar Relatório" em torneios Encerrado.

### 5. Notificações

`NotificationBell` ganha tipos: `torneio_convite, torneio_aprovacao, torneio_sorteio, torneio_pontuacao, torneio_encerrado`.

### 6. Arquivos

- **Migration**: 6 tabelas + 6 RPCs + trigger auditoria + RLS + realtime publication.
- **Renomear**: `src/pages/Torneios.tsx` → `HistoricoTorneios.tsx` (rota `/historico-torneios`).
- **Novo**: `Torneios.tsx`, `TorneioNovo.tsx`, `TorneioDetalhe.tsx`, `ConviteTorneio.tsx` + 7 componentes em `src/components/torneio/`.
- **Edge Functions**: `enviar-convite-torneio`, `notificar-evento-torneio` + templates de e-mail.
- **Edição**: `App.tsx` (rotas), `AppLayout.tsx` (menu), `lib/pdf.ts`, `types/`.
- **Setup**: app emails infrastructure (domínio + setup_email_infra + scaffold transactional) se ainda não existir.

### 7. Garantias

- Zero alteração nas tabelas existentes.
- Organizador nunca edita dados das aves alheias (RLS de `birds`).
- Sorteio 100% server-side (impossível manipular).
- Auditoria de toda alteração de pontuação.
- Pontuações em torneio encerrado bloqueadas.

