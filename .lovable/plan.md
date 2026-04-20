

# Painel Admin PlantelPro — Plano

Escopo grande. Vou entregar em **3 fases**, com a Fase 1 cobrindo ~70% do valor (dashboard + gestão) e fases 2-3 como complementos. Você aprova fase a fase.

## Limitações honestas antes de começar

Algumas métricas pedidas **não são possíveis hoje** sem instrumentar telemetria nova:

| Pedido | Status | Motivo |
|---|---|---|
| Tempo médio de sessão | ❌ Não dá | Não há tracking de sessão no app |
| Mobile vs desktop por user-agent | ⚠️ Parcial | Só temos `last_sign_in_at` em `auth.users`; user-agent não é persistido. Precisaria criar tabela `access_logs` e logar a cada login |
| Curva de retenção (D7/D30/D60) | ⚠️ Aproximação | Só temos 1 timestamp (`last_sign_in_at`), não histórico de logins. Posso aproximar via "cadastrados há X dias que logaram nos últimos Y" |
| Churn rate real | ⚠️ Aproximação | Mesmo motivo — vira "% sem login há 60d" |
| IP em logs admin | ⚠️ Edge function | Precisa proxy via edge function pra capturar IP |
| Reset de senha pelo admin | ✅ Via edge function service-role |
| Excluir usuário | ✅ Via edge function service-role |
| Bloquear/banir | ✅ Via edge function (`auth.admin.updateUserById` com `ban_duration`) |

**Recomendo aceitar as aproximações** na Fase 1 e, se quiser métricas reais de sessão/dispositivo, fazer Fase 2 com tabela `access_logs` + hook no login.

---

## FASE 1 — Dashboard + Gestão (esta entrega)

### 1.1 Banco

Migration nova:

```sql
-- Bloqueio lógico de usuário (camada app, complementa ban do auth)
ALTER TABLE public.profiles ADD COLUMN bloqueado boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN bloqueado_em timestamptz;
ALTER TABLE public.profiles ADD COLUMN bloqueado_motivo text;

-- Log de ações administrativas
CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  acao text NOT NULL,         -- 'bloquear', 'desbloquear', 'reset_senha', 'excluir', 'export_csv', 'view_user'
  alvo_user_id uuid,
  alvo_email text,
  detalhes jsonb DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_logs_select ON public.admin_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admin_logs_insert ON public.admin_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_user_id = auth.uid());
```

Função SQL agregadora (SECURITY DEFINER, gate por `has_role(admin)`):

```sql
CREATE FUNCTION public.admin_dashboard_metricas() RETURNS jsonb ...
```
Retorna em uma única chamada:
- `total_usuarios`, `novos_7d`, `novos_30d`, `crescimento_mes_pct`
- `ativos_30d`, `inativos_60d` (counts + pct)
- `media_aves_por_usuario`, `total_aves`
- `usuarios_com_torneio` (distinct em `torneio_participantes` + `torneio_grupo_membros` + `bateria_inscricoes`)
- `usuarios_com_emprestimo_ou_transferencia` (distinct em `bird_loans` + `pending_transfers`)
- `convites_enviados` (sum de `torneio_convites` + `torneio_grupo_convites` + `friendships` + `bird_loans`)
- `convites_aceitos` + taxa
- `media_amigos_por_usuario` (de `friendships` aceitas)
- `bloqueados_count`

Função série temporal:
```sql
CREATE FUNCTION public.admin_serie_novos_usuarios(_dias int) RETURNS TABLE(dia date, total int)
```
Para gráfico de linha (últimos 30/60/90 dias).

Função métricas individuais (sem dados sensíveis):
```sql
CREATE FUNCTION public.admin_user_detalhe(_user_id uuid) RETURNS jsonb
-- retorna: total_aves, total_torneios, total_emprestimos_dados, recebidos,
-- total_amigos, total_grupos, total_baterias_participou, ultimo_login, bloqueado
```

Atualiza `admin_listar_usuarios()` para incluir: `bloqueado`, `total_torneios`, `total_emprestimos`.

### 1.2 Edge functions (service-role, gate por `has_role(admin)`)

Cada uma valida JWT, checa role admin via service client, executa, e grava em `admin_logs`:

- `admin-bloquear-usuario` — flip `profiles.bloqueado` + `auth.admin.updateUserById({ ban_duration: '876000h' })` ou `'none'`
- `admin-resetar-senha` — `auth.admin.generateLink({ type: 'recovery', email })` e retorna o link (ou dispara via Outlook connector)
- `admin-excluir-usuario` — bloqueia se `total_aves > 0` exigindo `confirm: true`; usa `auth.admin.deleteUser(id)` (cascata por FKs nos `user_id`)
- `admin-export-usuarios` — retorna CSV com filtros aplicados

Bloqueio efetivo no app: `AuthContext` checa `profiles.bloqueado` no login; se true → signOut + toast "Conta bloqueada".

### 1.3 Frontend

Nova estrutura de rotas:
```
/admin                  → redirect para /admin/dashboard
/admin/dashboard        → cards + gráficos (NOVO)
/admin/usuarios         → lista melhorada (existe, vou expandir)
/admin/usuarios/:id     → detalhe individual (NOVO)
/admin/logs             → tabela admin_logs (NOVO)
```

Layout admin com sub-nav própria (`AdminLayout.tsx`) usando os mesmos tokens de cor mas com header "Modo Administrador".

Componentes:
- `AdminDashboard.tsx` — grid de KPI cards + `LineChart` (Recharts já presente via `chart.tsx`) novos usuários por dia + barra "convites enviados vs aceitos"
- `AdminUsuarios.tsx` (refator) — adiciona filtros (status ativo/inativo/bloqueado, faixa de aves, range de cadastro), botão Export CSV, menu de ações por linha (bloquear/reset senha/excluir/ver detalhes) com `AlertDialog` de confirmação
- `AdminUsuarioDetalhe.tsx` — métricas agregadas do usuário, **sem listar aves/anilhas**
- `AdminLogs.tsx` — tabela paginada de `admin_logs` com filtros

Sidebar: já tem item "Admin Usuários"; vou trocar por grupo expansível "Admin" → Dashboard, Usuários, Logs (só visível com `isAdmin`).

### 1.4 Privacidade (garantia)

Nenhuma rota/função expõe `birds.*`, `health_records.*`, `treatments.*`, pedigree, anilhas. Só `count(*)` agregado. Detalhe individual mostra **apenas contagens**.

---

## FASE 2 (depois) — Telemetria real

- Tabela `access_logs(user_id, created_at, user_agent, ip, device_type)`
- Edge function `log-access` chamada do `AuthContext` em cada login
- Métricas reais: mobile vs desktop, retenção D7/D30/D60 baseada em logins distintos, recovery requests
- Job pg_cron diário pra agregação

## FASE 3 (depois) — Configurações + Agendamento

- Tabela `system_config` (limite de aves, feature flags, mensagem global)
- Banner global de aviso lido de `system_config`
- pg_cron semanal → edge function `admin-relatorio-semanal` → e-mail via Outlook connector

---

## Diagrama de telas (Fase 1)

```text
┌─ Sidebar ──────┐  ┌─ /admin/dashboard ──────────────────────────┐
│ ...            │  │ [Total][Novos 7d][Ativos][Aves/usuário]     │
│ ▼ Admin        │  │ [Crescimento %][Inativos][Convites][Amigos] │
│   • Dashboard  │  │ ┌──────────── novos usuários (linha) ─────┐ │
│   • Usuários   │  │ │                                          │ │
│   • Logs       │  │ └──────────────────────────────────────────┘ │
└────────────────┘  │ ┌─ Engajamento ─┐ ┌─ Convites/Conversão ──┐ │
                    │ └───────────────┘ └─────────────────────-─┘ │
                    └──────────────────────────────────────────────┘
```

---

## Confirme antes de eu codar

1. **OK com aproximações** de retenção/churn/dispositivo na Fase 1? (alternativa: pular esses cards e fazer Fase 2 antes)
2. **Reset de senha**: gerar link e exibir pro admin copiar, ou disparar e-mail automático via Outlook connector?
3. **Excluir usuário**: bloquear se tiver aves (sugiro sim) ou permitir cascata destrutiva com dupla confirmação?
4. **Bloqueio**: usar `auth.admin` ban (impede login no auth) **e** flag `profiles.bloqueado`, ou só a flag (mais leve, validada no client)?

Responda e eu executo a Fase 1 inteira.

