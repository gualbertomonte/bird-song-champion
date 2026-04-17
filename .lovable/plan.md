

## Diagnóstico

Pelos logs de auth:
- Signup de `spinolagustavo57@gmail.com` ocorreu às 00:14:18 → Supabase pediu **confirmação de email** (`user_confirmation_requested`).
- Tentativas de login subsequentes às 00:15:40 e 00:18:09 falharam com `email_not_confirmed` (HTTP 400).
- O hook de envio de email rodou (`Hook ran successfully`), mas o usuário não recebeu (ou não clicou) o link de confirmação.

**Causa raiz:** O projeto está com **confirmação de email obrigatória** ativada no Supabase Auth, mas:
1. Não existe um domínio de email customizado configurado → emails são enviados pelo template padrão da Lovable, que pode cair em spam ou demorar.
2. Não há página/handler explícito para receber o callback de confirmação no app (o `emailRedirectTo` aponta para `window.location.origin` raiz, sem rota dedicada).
3. O usuário tem UX ruim: cria conta, é jogado para a tela de login e recebe "Invalid credentials" sem entender que precisa confirmar o email.

## Plano de correção

### Opção recomendada (rápida): desativar confirmação de email
Para um app interno de criadores onde o cadastro é direto, o mais prático é:
1. **Desativar "Confirm email"** nas configurações de Auth (auto-confirm signups). Usuário cria conta e já entra direto.
2. Remover do `Signup.tsx` a mensagem "Verifique seu email para confirmar" e fazer o redirect automático para `/dashboard` após o `signUp`.
3. No `Login.tsx`, manter mensagem clara caso ainda apareça `email_not_confirmed` para contas antigas.
4. **Confirmar manualmente** o usuário `spinolagustavo57@gmail.com` (e qualquer outro pendente) via SQL update em `auth.users` (set `email_confirmed_at = now()`), para destravar quem já cadastrou.

### Opção alternativa (mais robusta, se você quer manter confirmação):
1. Configurar domínio de email customizado da Lovable + templates de auth com branding.
2. Criar rota `/auth/callback` para tratar o token de confirmação corretamente.
3. Após signup, mostrar tela "Enviamos um email para X — clique no link para ativar sua conta" (em vez de jogar direto no login).
4. Reenvio de email de confirmação via botão "Não recebi o email" no Login quando der `email_not_confirmed`.

## Arquivos afetados (Opção recomendada)
- 1 chamada para configurar auth (desativar confirmação obrigatória)
- 1 data-fix SQL (confirmar usuários pendentes existentes)
- `src/pages/Signup.tsx` (mensagem + redirect direto)
- `src/pages/Login.tsx` (mensagem específica para `email_not_confirmed`, opcional botão de reenvio)

## Pergunta antes de prosseguir
Qual opção você prefere?

