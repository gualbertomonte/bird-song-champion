

User pede 2 coisas:
1. Criar página `/admin/usuarios` protegida por papel admin, listando profiles com data de cadastro, total de aves e último login.
2. Testar o signup criando uma conta nova e verificar se a notificação chega.

Sobre #2: não consigo "criar conta de teste" automaticamente — isso requer que **você** crie a conta no `/signup` com um e-mail real seu. Posso ajudar verificando os logs da edge function depois que você testar.

Sobre #1: preciso planejar — exige tabela `user_roles` (que NÃO existe no schema atual), enum `app_role`, função `has_role`, RLS, página React com agregação.

Plano:

## 1. Banco de dados (migração)

- **Enum** `app_role` com valor `admin`.
- **Tabela** `public.user_roles` (id, user_id, role, unique(user_id, role)) com RLS.
- **Função** `public.has_role(_user_id, _role)` SECURITY DEFINER (evita recursão de RLS).
- **RLS** em `user_roles`: usuário vê suas próprias roles; só admin pode inserir/deletar.
- **RPC** `public.admin_listar_usuarios()` SECURITY DEFINER que retorna por usuário: `user_id`, `email`, `display_name`, `nome_criadouro`, `created_at` (signup), `total_aves`, `last_sign_in_at` (de `auth.users`). Bloqueia se chamador não for admin.
- **Seed**: inserir você como admin (vou usar o `user_id` do seu profile atual via `auth.uid()` — você confirma o e-mail abaixo).

## 2. Frontend

- **Nova página** `src/pages/AdminUsuarios.tsx`: tabela com colunas Email / Criadouro / Cadastro / Aves / Último login. Busca por email. Loader e empty state padronizados.
- **Hook** `useIsAdmin()` que consulta `has_role(auth.uid(), 'admin')`.
- **Rota** `/admin/usuarios` em `App.tsx`, dentro do layout protegido. Componente `AdminRoute` que redireciona não-admins para `/`.
- **Link no sidebar** (visível só para admin) com ícone `Shield`.

## 3. Arquivos
- Migração SQL (nova)
- `src/pages/AdminUsuarios.tsx` (nova)
- `src/hooks/useIsAdmin.ts` (nova)
- `src/App.tsx` (adicionar rota + AdminRoute)
- `src/components/AppLayout.tsx` (adicionar item de menu condicional)

## 4. Confirme antes de eu executar

**Qual é o e-mail da sua conta** (a que deve ser marcada como admin no seed)? Sem isso só posso criar a estrutura — você teria que rodar manualmente um INSERT depois.

## 5. Sobre o teste de signup

Eu não consigo criar contas reais por você. Após eu implementar o admin, **você faz**:
1. Abre uma aba anônima → `/signup` → cria conta com e-mail novo.
2. Eu verifico os logs da edge function `notify-admin-new-signup` para confirmar disparo e entrega.
3. Você confirma se chegou na caixa do admin.

Me passe seu e-mail admin e eu sigo.

