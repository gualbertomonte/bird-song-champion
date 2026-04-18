
User quer facilitar ainda mais o convite porque o app é novo e quase não tem usuários cadastrados. Logo, depender de "amigos já aceitos" ou de "usuário já existir no app" é fricção alta. O foco deve ser **convidar quem ainda NEM tem conta**.

## Plano: convite "viral" para grupos (foco em quem não é usuário)

### Ideia central
Substituir o modal atual (que só mostra amigos) por um modal único focado em **link público + convite por email**, pensado para o admin compartilhar no WhatsApp com pessoas que ainda não usam o app.

### 1. Link público de convite ao grupo (principal)
- Nova coluna `token uuid` em `torneio_grupo_convites` (ou nova tabela `torneio_grupo_convite_links` com token único por grupo, reutilizável).
- Decisão: **1 link único por grupo** (mais simples, fácil de compartilhar várias vezes). Coluna `convite_token uuid` direto em `torneio_grupos`.
- Nova página pública `/entrar/grupo/:token`:
  - Mostra nome do grupo, admin, nº de membros, descrição.
  - Botão grande "Entrar no grupo".
  - Se logado → RPC `aceitar_convite_grupo_por_token(_token)` adiciona como membro e redireciona para `/grupos/:id`.
  - Se NÃO logado → tela com 2 botões: "Já tenho conta (entrar)" e "Criar conta grátis". Após login/signup, volta automaticamente para o link e entra no grupo.
- No admin: botão "Copiar link" + "Compartilhar no WhatsApp" (com mensagem pronta: "Você foi convidado para o grupo X no PlantelPro: [link]").

### 2. Convite por email (mesmo de quem não tem conta)
- Novo modal substitui o atual, com 2 tabs:
  - **Tab "Link"** (padrão): mostra o link público + botão WhatsApp + QR code pequeno.
  - **Tab "Por email"**: input de email → RPC `convidar_por_email_grupo(_grupo_id, _email)`:
    - Se email existe em `profiles` → cria convite normal em `torneio_grupo_convites` + notificação.
    - Se NÃO existe → cria registro em nova tabela `torneio_grupo_convites_email (grupo_id, email, token, status)` + dispara edge function `send-grupo-invite-email` com link `/entrar/grupo/:token?email=...`.
  - Quando o destinatário criar conta com aquele email, um trigger ou check no login resolve automaticamente o convite pendente.

### 3. Remover dependência de "amigo aceito"
- Tab "Amigos" continua existindo (atalho rápido) mas deixa de ser o caminho principal. Aparece embaixo, como "Adicionar amigos do app" (lista compacta).

### 4. Edge function de email
- `supabase/functions/send-grupo-invite-email/index.ts` — usa Resend (já configurado para outras functions de email) com template simples: "Fulano convidou você para o grupo X. [Botão Aceitar]".

### Backend (1 migration)
1. `ALTER TABLE torneio_grupos ADD COLUMN convite_token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL;` (preenche existentes com uuid).
2. Nova tabela `torneio_grupo_convites_email (id, grupo_id, email, token, convidado_por, status, created_at, claimed_user_id)` + RLS (admin do grupo lê/cria/cancela).
3. RPC `aceitar_convite_grupo_por_token(_token uuid)` — security definer, resolve grupo, insere em `torneio_grupo_membros` se ainda não for membro.
4. RPC `convidar_por_email_grupo(_grupo_id uuid, _email text)` — decide entre fluxo logado/email.
5. RPC pública `get_grupo_convite_publico(_token uuid)` — retorna `{ nome, descricao, admin_nome, total_membros }` sem auth.
6. Trigger `on_auth_user_created` (ou ajuste no existente) → ao criar usuário, procurar `torneio_grupo_convites_email` por email e marcar como pendentes para o user_id (ou auto-aceitar opcional).

### Frontend
- `src/pages/EntrarGrupo.tsx` (rota pública `/entrar/grupo/:token`).
- Refatorar `src/components/grupos/ConvidarMembroModal.tsx` com 3 abas: **Link** (padrão), **Email**, **Amigos**.
- `src/pages/GrupoDetalhe.tsx`: header ganha botão "Compartilhar grupo" (ícone de share) que abre o modal direto na aba Link.
- `src/App.tsx`: nova rota pública.

### Resultado para o usuário
Admin clica em "Compartilhar grupo" → escolhe WhatsApp → cola na conversa. Quem recebe abre o link, faz signup em 30s e já cai dentro do grupo. **Zero dependência de o convidado já existir no app**.
