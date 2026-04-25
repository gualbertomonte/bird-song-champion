
# Plano completo — 4 frentes

---

## ✅ FRENTE 1 — Cache busting do ícone (já aprovado antes)

**Arquivos:**
- `index.html` — adicionar `?v=2` em `/favicon.png` e `/icon-512.png`
- `public/manifest.webmanifest` — adicionar `?v=2` nas duas entradas de `icon-512.png`

**Você faz depois:** Publish → Update + reindexação no Search Console

---

## 🎨 FRENTE 2 — Corrigir tooltips ilegíveis no admin

**Problema:** No tema escuro do `/admin/dashboard`, o texto "Usuários únicos : 2" fica cinza-escuro sobre fundo verde-escuro (visto no print).

**Causa:** Recharts usa cores padrão dos `<Tooltip>` que não respeitam o tema escuro do admin.

**Correção em `src/pages/AdminDashboard.tsx`:**
- Adicionar `itemStyle={{ color: 'hsl(var(--foreground))' }}` e `labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}` nos 2 `<Tooltip>` (gráfico de novos usuários e gráfico de acessos)
- Aumentar contraste do `contentStyle` (background mais opaco, padding maior)

**Correção em `src/components/dashboard/AtividadeChart.tsx`:**
- Mesma coisa no tooltip (já que é o mesmo padrão visual)

---

## 🔔 FRENTE 3 — Notificações em tempo real de novos cadastros

### Parte A — Validar e-mail existente
- Verifiquei: a edge function `notify-admin-new-signup` existe e está ativa (logs mostram boots recentes)
- Vou conferir os **últimos logs com search "error"** pra garantir que está realmente entregando o e-mail. Se não estiver, corrijo.

### Parte B — Sino piscante no admin (Realtime)

**1. Habilitar Realtime na tabela `profiles`** (migração SQL):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
```

**2. Criar componente `src/components/admin/AdminNotificationBell.tsx`:**
- Subscreve no canal Realtime de `INSERT` em `profiles`
- Mantém contador de "novos não vistos" (persiste no localStorage por admin)
- Sino com badge vermelho pulsante quando count > 0
- Som curto (opcional) ao chegar novo cadastro
- Dropdown lista os últimos 10 cadastros (nome, e-mail, "há X minutos")
- Clique em "marcar como visto" zera o contador
- Clique em um item → abre `/admin/usuarios/{id}`

**3. Integrar no `src/components/admin/AdminLayout.tsx`:**
- Adicionar o sino no header, ao lado do nome do admin

---

## 📊 FRENTE 4 — Tracking completo (os 3 que você pediu)

### Parte A — Plausible Analytics (visitas anônimas ao site)

**Por que Plausible e não Google Analytics:**
- ✅ Sem cookies, sem banner de LGPD/cookies obrigatório
- ✅ Painel simples e leve (não polui o site, +1KB)
- ✅ Mostra: visitantes únicos, páginas mais vistas, fontes de tráfego (Google, Instagram, WhatsApp), países
- ⚠️ É pago (~US$ 9/mês depois do trial de 30 dias) — alternativa gratuita: **Umami** (auto-hospedado, mais técnico) ou **Google Analytics 4** (gratuito mas com cookies)

**Implementação:**
- Adicionar 1 tag `<script>` no `<head>` do `index.html`
- Você cria conta em https://plausible.io e adiciona o domínio `meuplantelpro.com.br`
- Pronto — começa a contar visitas em tempo real

> **Alternativa se preferir gratuito:** uso o **GA4** (Google Analytics 4) — gratuito pra sempre, mas exige banner de cookies. Me diga qual prefere.

### Parte B — Links rastreáveis (cliques em campanhas WhatsApp/Instagram)

**Sistema próprio dentro do app, sem ferramenta externa:**

**1. Migração SQL:**
```sql
CREATE TABLE public.tracked_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,           -- "whatsapp", "instagram-bio", "panfleto"
  destino text NOT NULL,               -- URL final (default: /)
  descricao text,                      -- "Link do WhatsApp da feira de canários"
  total_clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

CREATE TABLE public.tracked_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
  ip text,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
+ RLS: só admin pode ler/criar links; insert de clicks é público (via edge function)

**2. Edge function `track-link-click`** — recebe slug, registra click, redireciona pro destino

**3. Página `src/pages/AdminLinks.tsx`:**
- Lista todos os links rastreáveis
- Cria novo: digita slug + destino + descrição
- Mostra total de cliques de cada um e gráfico (cliques por dia)
- Botão "copiar link" → `https://meuplantelpro.com.br/r/{slug}`

**4. Rota `/r/:slug`** no React Router → chama edge function → redireciona

**Fluxo:** você compartilha `meuplantelpro.com.br/r/whatsapp` no WhatsApp, cada clique conta, redireciona pro `/`

### Parte C — Dashboard interno de visitas (página `page_views`)

**1. Migração SQL:**
```sql
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,                   -- "/", "/login", etc
  referrer text,                        -- de onde veio
  utm_source text,                      -- ?utm_source=instagram
  utm_medium text,
  utm_campaign text,
  user_agent text,
  device_type text,                     -- mobile/desktop/tablet
  session_id text,                      -- cookie de sessão (visitante único)
  user_id uuid,                         -- se logado
  created_at timestamptz NOT NULL DEFAULT now()
);
```
+ RLS: insert público (anônimo pode contar visita); select só admin

**2. Hook `src/hooks/usePageTracking.ts`:**
- Roda em cada mudança de rota (`useLocation`)
- Insere row em `page_views` com path, referrer, UTM, device, session_id
- Session ID gerado uma vez por visita (sessionStorage)

**3. Integrar no `App.tsx`** — chama hook globalmente

**4. Nova seção no `AdminDashboard.tsx`:**
- KPI: visitas hoje / 7d / 30d
- KPI: visitantes únicos (por session_id)
- Gráfico de barras: visitas por dia (30 dias)
- Top 5 páginas mais vistas
- Top 5 fontes de tráfego (referrer / utm_source)
- Split mobile/desktop

---

## 📋 Ordem de execução (após aprovação)

1. **Cache busting** (1 min) — pequeno, despacha junto
2. **Tooltips legíveis** (2 min) — fix visual rápido
3. **Validar e-mail de signup** (1 min) — só leitura de logs
4. **Realtime + sino piscante** (10 min) — migração + componente + integração
5. **page_views + dashboard interno** (15 min) — migração + hook + nova seção
6. **Links rastreáveis** (15 min) — migração + edge function + página admin + rota
7. **Plausible** (3 min) — só adicionar 1 script no `index.html` (você cria conta depois)

**Tempo total estimado:** ~50 minutos de execução em uma rodada.

---

## ⚠️ Decisão pendente: Plausible (pago) vs GA4 (gratuito)

Por padrão vou de **Plausible** (recomendação técnica: sem cookies, mais simples). Se você preferir **GA4 gratuito**, me avisa antes de eu aplicar e troco.
