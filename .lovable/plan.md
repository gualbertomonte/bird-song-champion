
Plano: introduzir o conceito de **Grupo de Torneio** (comunidade fixa) com **Baterias** (eventos) e **Ranking acumulado**, reaproveitando o sistema de Amigos já existente. Mantemos o `/torneios` atual como "Torneios Avulsos" e adicionamos `/grupos` como nova seção principal.

## 1. Banco (migration)

**Novas tabelas (todas com RLS):**

- `torneio_grupos` — `id, admin_user_id, nome, descricao, regulamento_padrao, criado_em`.
- `torneio_grupo_membros` — `id, grupo_id, user_id, papel` ('admin'|'membro'), `status` ('Pendente'|'Ativo'|'Saiu'), `created_at`. Unique(grupo_id, user_id).
- `torneio_grupo_convites` — `id, grupo_id, convidado_user_id, status` ('Pendente'|'Aceito'|'Recusado'), `created_at`.
- `torneio_baterias` — `id, grupo_id, nome, data, numero_estacoes, regulamento, status` ('Agendada'|'Inscricoes'|'Sorteada'|'Em andamento'|'Encerrada'), `criado_por, encerrado_em`.
- `bateria_inscricoes` — `id, bateria_id, membro_user_id, bird_id, bird_snapshot, status` ('Pendente'|'Aprovada'|'Rejeitada'), `estacao int, motivo_rejeicao`. Unique(bateria_id, bird_id).
- `bateria_pontuacoes` — `id, bateria_id, inscricao_id, pontos numeric, registrado_por, created_at, updated_at`. Unique(inscricao_id).

**Funções SECURITY DEFINER:**
- `is_grupo_admin(_grupo_id)`, `is_grupo_membro(_grupo_id)` — helpers para RLS sem recursão.
- `criar_grupo_torneio(nome, descricao, regulamento)` — cria grupo + adiciona criador como admin.
- `convidar_membro_grupo(_grupo_id, _user_id)` — admin convida amigo.
- `responder_convite_grupo(_convite_id, _aceitar)` — usuário aceita/rejeita.
- `sair_do_grupo(_grupo_id)` — membro sai (admin não pode sair sem transferir).
- `criar_bateria(grupo_id, nome, data, num_estacoes, regulamento)` — só admin.
- `inscrever_ave_bateria(_bateria_id, _bird_id)` — membro ativo, ave macho.
- `aprovar_inscricao_bateria(_inscricao_id, _aprovar, _motivo)` — só admin.
- `sortear_estacoes_bateria(_bateria_id)` — server-side `random()`, refazível antes de "Em andamento".
- `registrar_pontuacao_bateria(_inscricao_id, _pontos)` — só admin, bloqueia se Encerrada.
- `encerrar_bateria(_bateria_id)`.

**View `ranking_acumulado_grupo`** — agrega `bateria_pontuacoes` por `(grupo_id, membro_user_id, bird_id)` somando pontos de baterias **encerradas** do grupo. Retorna nome da ave, dono, total, nº baterias, melhor colocação.

**RLS-chave:**
- `birds` intocada → admin nunca edita aves alheias.
- Membros leem grupo/baterias/pontuações; só admin insere/edita via RPC.
- Realtime em `bateria_pontuacoes` e `bateria_inscricoes`.

## 2. Frontend

**Novas rotas:**
- `/grupos` — lista de grupos (criados ou membro), botão "Criar grupo".
- `/grupos/novo` — wizard simples: nome, descrição, regulamento padrão, convidar amigos iniciais (usa `AmigoSelector` em modo multi).
- `/grupos/:id` — abas:
  - **Visão Geral** (descrição, regulamento, lista de membros, ranking acumulado top 10).
  - **Membros** (admin: convidar amigo, ver pendentes, remover).
  - **Baterias** (lista + botão "Nova bateria" para admin).
  - **Ranking Acumulado** (tabela completa: ave · proprietário · baterias disputadas · total · 🥇🥈🥉).
- `/grupos/:id/baterias/:bateriaId` — abas:
  - **Inscrições** (membro inscreve ave macho; admin aprova/rejeita).
  - **Sorteio** (admin: botão "Sortear estações" / "Refazer"; tabela Estação→Ave).
  - **Pontuação** (admin: input por inscrição).
  - **Classificação** (realtime, badges, destaque "minha ave", botão PDF quando encerrada).

**Componentes novos** (`src/components/grupos/`):
- `GrupoCard.tsx`, `MembrosList.tsx`, `ConvidarMembroModal.tsx` (reusa `AmigoSelector`).
- `BateriaCard.tsx`, `NovaBateriaModal.tsx`, `InscricoesBateriaTab.tsx`, `SorteioBateriaTab.tsx`, `PontuacaoBateriaTab.tsx`, `ClassificacaoBateriaTab.tsx`.
- `RankingAcumuladoTable.tsx`.

**Hooks novos** (`src/hooks/`):
- `useGrupos.ts` — lista grupos do usuário (admin/membro), realtime.
- `useGrupoDetalhe.ts` — grupo + membros + baterias + ranking, realtime.
- `useBateria.ts` — bateria + inscrições + pontuações, realtime.

**Reuso do AmigoSelector:** já está integrado em transferências, empréstimos e convites de torneio. Adicionamos modo `multi` (múltiplos amigos) usado em "convidar para grupo" e "convidar para bateria".

**Notificações** (extende `NotificationBell`): `grupo_convite`, `grupo_aceito`, `bateria_criada`, `inscricao_aprovada`, `bateria_encerrada`.

**PDF:** `src/lib/pdf.ts` ganha `gerarRelatorioBateria(bateria, classificacao, grupo)` e `gerarRankingAcumulado(grupo, ranking)`.

**Menu lateral (`AppLayout`):** novo item "Grupos" entre "Torneios" e "Histórico".

## 3. Garantias

- Zero alteração em `birds`, `friendships`, `torneios` (sistema antigo continua intacto).
- Sorteio 100% server-side.
- Apenas machos podem ser inscritos (regra herdada).
- Ranking acumulado considera só baterias **Encerradas** (evita placar instável).
- Mobile-first: modais com `max-h-[92vh]` + footer sticky, tabelas com scroll horizontal.

## 4. Arquivos

- **Migration**: 6 tabelas + view + 10 RPCs + RLS + realtime publication.
- **Novos**: 3 páginas, 10 componentes, 3 hooks, 1 type file (`types/grupo.ts`).
- **Edição**: `App.tsx` (rotas), `AppLayout.tsx` (menu), `lib/pdf.ts`, `AmigoSelector.tsx` (modo multi), `NotificationBell.tsx` (novos tipos).

Após aprovação, executo na ordem: **migration → types/hooks → páginas/componentes → integrações de menu/notificações/PDF → revisão mobile final**.
