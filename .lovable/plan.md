

User pergunta: "consigo receber no e-mail a cada usuário inscrito?"

Interpretação: o usuário quer ser notificado por e-mail quando alguém novo se cadastrar no sistema (signup). Ele é o admin/dono do app e quer saber a cada novo usuário criado.

Verificando contexto:
- Projeto tem Lovable Cloud (Supabase) com auth
- Já existem 2 edge functions de email: `send-transfer-email` e `send-loan-email` usando Microsoft Outlook connector
- Não há infraestrutura de e-mail Lovable configurada (nenhum domínio mencionado)
- Tabela `profiles` existe e provavelmente é populada via trigger `handle_new_user` no signup

Solução proposta: criar uma edge function `notify-admin-new-signup` que envia e-mail ao admin quando um novo usuário se cadastra. Como já existe integração Outlook funcionando, posso reutilizar o mesmo padrão.

Duas formas de disparar:
1. Trigger no banco (`auth.users` insert) → chama edge function via `pg_net` — mais robusto
2. Frontend após signup → chama edge function — mais simples mas depende do client

Vou propor a opção 1 (trigger) por ser mais confiável (funciona mesmo se o usuário fecha o navegador antes do redirect, ou se signup vier de OAuth).

Preciso saber: qual e-mail receberá as notificações.

## Plano

### O que será feito
Criar notificação por e-mail enviada **automaticamente para você** sempre que um novo usuário se cadastrar no Plantel Pro+.

### Como funciona
1. Nova edge function `notify-admin-new-signup` reutilizando o conector Outlook já configurado (mesmo padrão de `send-loan-email`).
2. Trigger no banco que dispara essa função sempre que um novo registro aparece em `profiles` (criado pelo `handle_new_user` após signup).
3. E-mail conterá: nome, e-mail do novo usuário, data/hora do cadastro e total acumulado de usuários.

### Arquivos / mudanças
- **Nova**: `supabase/functions/notify-admin-new-signup/index.ts`
- **Migração**: criar trigger `on_new_profile_notify_admin` em `public.profiles` que chama a function via `pg_net`
- **Secret novo**: `ADMIN_NOTIFY_EMAIL` (seu e-mail) — solicitado via add_secret após aprovação

### O que preciso de você
Confirmar **qual e-mail** receberá as notificações. Se for o mesmo já cadastrado no seu perfil de criador, posso usar esse — senão, me diga qual.

### Alternativa mais simples (sem trigger no banco)
Se preferir, posso disparar do frontend logo após o signup em `Signup.tsx`. Funciona, mas se o usuário fechar a aba antes do redirect ou criar conta via Google OAuth, o e-mail pode falhar. Por isso recomendo o trigger.

