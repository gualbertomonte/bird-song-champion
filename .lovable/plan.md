

# Renomear "PlantelPro" → "MeuPlantelPro"

## Stack real (não é Node/Laravel)

Antes de tudo: este projeto é **React + Vite + TypeScript + Tailwind**, com backend gerenciado (Lovable Cloud / Supabase) via edge functions Deno. Não existe Express, Laravel, `composer.json`, `config/app.php`, `docker-compose.yml`, nem nginx no repo. O guia abaixo é adaptado à stack real — itens irrelevantes do pedido foram descartados (não inventados).

A marca atual no código é **"Plantel Pro+"** (com espaço e "+"), não "PlantelPro" puro. Vou padronizar tudo para **"MeuPlantelPro"**.

## 1. Frontend — textos visíveis

| Arquivo | Trechos a alterar |
|---|---|
| `index.html` | `<title>`, `<meta name="description">`, `apple-mobile-web-app-title`, `og:title`, `twitter:title`, `og:description`, `twitter:description` |
| `public/manifest.webmanifest` | `name`, `short_name`, `description` |
| `src/components/AppLayout.tsx` | Logo lateral: `Plantel Pro+` e tagline `Aviário Premium` (manter ou ajustar?) |
| `src/components/admin/AdminLayout.tsx` | Header: `Plantel Pro+` + `Modo Administrador` |
| `src/components/SystemBanner.tsx` | Verificar se referencia o nome |
| `src/pages/Login.tsx`, `Signup.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx` | Títulos, headings, mensagens de boas-vindas |
| `src/pages/Index.tsx`, `NotFound.tsx` | Possíveis menções |
| `src/pages/Perfil.tsx`, `AdminConfiguracoes.tsx` | Cabeçalhos |
| Toasts e mensagens em hooks/páginas | Buscar globalmente |

Estratégia: rodar `grep -ri "plantel" src/ index.html public/` e revisar **caso a caso** (não fazer sed cego — alguns "plantel" são da palavra de domínio "plantel de aves" e devem ser mantidos).

Substituições explícitas:
- `Plantel Pro+` → `MeuPlantelPro`
- `Plantel Pro` → `MeuPlantelPro`
- `PlantelPro` → `MeuPlantelPro`
- `plantelpro` (em URLs de exemplo) → `meuplantelpro`

**Não tocar**: a palavra "plantel" sozinha (ex.: "Gestão de plantel", rota `/plantel`, página `Plantel.tsx`) — é o conceito do produto, não a marca.

## 2. Backend (Edge Functions Deno)

Arquivos: `supabase/functions/*/index.ts`.

| Função | O que mudar |
|---|---|
| `notify-admin-new-signup/index.ts` | `subject: "🎉 Novo usuário no Plantel Pro+"`, HTML do e-mail (`<h1>`, botão "Abrir Plantel Pro+"), `SITE_URL = 'https://plantelpro.lovable.app'` |
| `send-loan-email/index.ts` | Assunto, corpo, rodapé, links |
| `send-transfer-email/index.ts` | Assunto, corpo, rodapé, links |
| `check-health-alerts/index.ts` | Mensagens de notificação |
| Demais funções `admin-*` | Verificar mensagens de log/resposta |

`SITE_URL` deve apontar para `https://meuplantelpro.com.br` (ver §5 sobre domínio).

## 3. Banco de dados

Auditoria primeiro, mudança depois. Vou rodar uma query no migration:

```sql
SELECT key, value FROM public.system_config;  -- procurar string "Plantel"
SELECT id, mensagem FROM public.weekly_reports LIMIT 5;
```

- **Não há tabela com nome `plantel_pro_*`** no schema atual (já verificado pela arquitetura). Nada a renomear estruturalmente.
- Se `system_config` tiver `banner_mensagem` ou textos contendo "Plantel Pro+", criar migration `UPDATE public.system_config SET banner_mensagem = REPLACE(banner_mensagem, 'Plantel Pro+', 'MeuPlantelPro')`.
- Funções RPC com mensagens de erro hardcoded em português: revisar `admin_*` functions; se contiverem o nome, atualizar.

## 4. Configuração / metadados

| Arquivo | Ação |
|---|---|
| `package.json` | Campo `name` (atualmente provavelmente `vite_react_shadcn_ts` — confirmar e renomear se relevante) |
| `README.md` | Reescrever cabeçalho com nome novo + descrição |
| `public/robots.txt` | Verificar se tem nome |
| `.env` | **NÃO TOCAR** — gerenciado automaticamente, não tem nome de marca |
| `supabase/config.toml` | `project_id` fica como está (é ID interno, não marca) |

Não existem: `.env.example`, `docker-compose.yml`, `nginx.conf`, `composer.json`, `config/app.php`. Pular.

## 5. Domínio `meuplantelpro.com.br`

Domínio customizado é configurado no painel Lovable, não em código:
1. **Settings → Domains → Connect Domain** → digitar `meuplantelpro.com.br` e `www.meuplantelpro.com.br`.
2. No registrador (.com.br = Registro.br), criar:
   - `A @ → 185.158.133.1`
   - `A www → 185.158.133.1`
   - `TXT _lovable → lovable_verify=…` (valor dado pelo painel)
3. Aguardar verificação + SSL automático (até 72h, normalmente minutos).
4. Atualizar `SITE_URL` nas edge functions de e-mail (passo §2) **depois** que o domínio estiver Active.

Posso atualizar o código, mas a parte de DNS você executa fora do Lovable.

## 6. Pós-renomeação

- Hard refresh do navegador (Ctrl+Shift+R) para invalidar PWA antigo — `short_name` mudou, o navegador vai re-registrar o manifest.
- Usuários com app instalado via PWA verão o novo nome após reabrir; ícone só muda se o ícone for trocado também (favicon/icon-512 estão sem texto, então não precisa).
- Edge functions redeploiam automaticamente ao salvar.
- Sem `npm run build` manual — Lovable rebuilda sozinho.

## 7. Checklist final

- [ ] `index.html`: title, meta description, og/twitter, apple-mobile-web-app-title
- [ ] `manifest.webmanifest`: name, short_name, description
- [ ] Sidebar criador (`AppLayout.tsx`)
- [ ] Header admin (`AdminLayout.tsx`)
- [ ] Páginas de auth (Login, Signup, Forgot, Reset)
- [ ] Edge functions de e-mail: assunto, corpo, botão CTA, SITE_URL
- [ ] `system_config.banner_mensagem` (se aplicável)
- [ ] `package.json` name
- [ ] `README.md`
- [ ] `grep -ri "plantel pro" src/ index.html public/ supabase/` retorna 0 ocorrências
- [ ] `grep -ri "plantelpro" src/ index.html public/ supabase/` só mostra subdomínio antigo onde for histórico
- [ ] Domínio `meuplantelpro.com.br` adicionado no painel Lovable e Active
- [ ] Hard refresh confirma novo nome no título da aba e na tela inicial PWA
- [ ] Enviar e-mail de teste (convite/empréstimo) e verificar assunto + corpo + link CTA

## Decisões que preciso de você antes de executar

1. **Tagline "Aviário Premium"** abaixo do logo — manter, trocar por outra, ou remover?
2. **Logo/ícone** (`public/icon-512.png`, `favicon.ico`) — manter os atuais ou você vai me enviar arte nova com a marca "MeuPlantelPro"?
3. **`SITE_URL` nas edge functions** — devo já trocar para `https://meuplantelpro.com.br` agora (e-mails ficarão com link quebrado até o DNS propagar) ou manter `https://plantelpro.lovable.app` até o domínio estar Active?
4. **`system_config.banner_mensagem`** atual — quer que eu rode um `UPDATE` cego de REPLACE, ou prefere revisar manualmente em `/admin/configuracoes`?

Responda os 4 e eu executo a renomeação inteira numa só passada.

