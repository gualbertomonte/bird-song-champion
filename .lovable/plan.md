

# Remover funções de criador do administrador

## Objetivo

O usuário admin (`plantel.pro@outlook.com.br`) só serve para controlar o sistema. Hoje ele vê todo o menu de criador (Dashboard, Plantel, Árvore, Berçário, Empréstimos, Torneios, Saúde, Amigos, Perfil) + um item "Admin". Vamos isolar o admin no painel administrativo.

## Comportamento final

- Ao logar como admin → cai direto em `/admin/dashboard`.
- Admin **não** vê o `AppLayout` de criador. Não vê sidebar de Plantel/Torneios/Berçário etc.
- Tentativas de acessar rotas de criador (`/`, `/plantel`, `/torneios`, `/bercario`, …) → redireciona para `/admin/dashboard`.
- Usuários não-admin continuam exatamente como hoje. Nenhum impacto na experiência do criador.
- Botão "Sair" e troca de tema continuam acessíveis dentro do `AdminLayout`.

## Mudanças técnicas

### 1. `src/App.tsx` — separar árvore de rotas por papel

Dentro de `ProtectedRoute`, decidir por `useIsAdmin()`:

- **Se admin**: montar apenas as rotas `/admin/*` envolvidas no `AdminLayout`. Qualquer outra rota → `<Navigate to="/admin/dashboard" replace />`. Não envolver em `AppProvider`/`AppLayout` (que carregam dados de plantel desnecessários).
- **Se não-admin**: comportamento atual (`AppProvider` + `AppLayout` + rotas de criador). Rotas `/admin/*` → `<Navigate to="/" replace />`.

Criar um pequeno `RoleRouter` interno para encapsular essa decisão e mostrar `PageLoader` enquanto `useIsAdmin` carrega.

### 2. `src/components/admin/AdminLayout.tsx` — virar layout completo

Hoje é só um header com sub-nav, assumindo que está dentro do `AppLayout`. Como o admin não vai mais passar pelo `AppLayout`, o `AdminLayout` precisa ser standalone:

- Wrapper `min-h-screen bg-background` com header próprio contendo: logo PlantelPro, badge "Modo Administrador", e-mail do admin, botão **Sair** (`useAuth().signOut`).
- Manter a sub-nav atual (Dashboard, Usuários, Logs, Relatórios, Configurações).
- Renderizar `<SystemBanner />` no topo (mesmo banner global, para o admin ver o que publicou).
- Continua suportando `children` e `<Outlet />` para não quebrar as rotas atuais.

### 3. `src/components/AppLayout.tsx` — remover atalho "Admin"

- Remover o item `Admin` injetado em `allNavItems` (linhas 49-51) e o import de `Shield`/`useIsAdmin` que ficam órfãos. Como admin nunca mais entra aqui, esse atalho perde o sentido.

### 4. `src/context/AuthContext.tsx` — sem mudanças

O fluxo de login continua igual; o redirecionamento para `/admin/dashboard` é resolvido pelas rotas do passo 1 (admin que cair em `/` é redirecionado).

### 5. `PublicRoute` (login/signup) — ajuste leve

Hoje, após login, redireciona para `?redirect=` ou `/`. Para admin, `/` será redirecionado novamente para `/admin/dashboard` pelo `RoleRouter`, então não precisa mudar nada — o duplo redirect resolve sozinho.

## Diagrama

```text
LOGIN
  │
  ├── não-admin ──► AppProvider + AppLayout
  │                  ├── /              Dashboard criador
  │                  ├── /plantel       …
  │                  └── /admin/*       → Navigate("/")
  │
  └── admin     ──► AdminLayout (standalone, com Sair + Banner)
                     ├── /admin/dashboard
                     ├── /admin/usuarios[/:id]
                     ├── /admin/logs
                     ├── /admin/relatorios
                     ├── /admin/configuracoes
                     └── qualquer outra rota → Navigate("/admin/dashboard")
```

## Arquivos tocados

- `src/App.tsx` (refator de rotas, novo `RoleRouter`)
- `src/components/admin/AdminLayout.tsx` (vira layout completo com header + Sair + Banner)
- `src/components/AppLayout.tsx` (remove item "Admin" e imports órfãos)

Sem migrations, sem mudanças de RLS, sem alteração nas políticas de admin existentes.

