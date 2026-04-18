
User wants to nest "Grupos" inside "Torneios" instead of being a top-level menu item. Let me check current structure.

Current state:
- `/torneios` — Torneios Avulsos list
- `/grupos` — separate top-level menu item
- AppLayout has both as separate sidebar entries

Plan: unify under Torneios with tabs.

## Mudanças

**1. `src/pages/Torneios.tsx`** — adicionar duas abas no topo:
- **Avulsos** (conteúdo atual da página)
- **Grupos** (conteúdo de `/grupos`: lista de grupos + convites pendentes + botão "Criar grupo")

A aba ativa controlada por query param `?tab=grupos` para preservar deep-link.

**2. `src/components/AppLayout.tsx`**:
- Remover item "Grupos" do `navItems` (sidebar desktop).
- Remover `grupos` do `ALL_MOBILE_ITEMS` (já não estava, ok).

**3. `src/App.tsx`** — manter as rotas `/grupos`, `/grupos/novo`, `/grupos/:id`, `/grupos/:id/baterias/:bateriaId` funcionando (deep-links de convites/notificações continuam válidos). Adicionar redirect: `/grupos` → `/torneios?tab=grupos` (opcional, mas mantém retrocompatibilidade do menu antigo).

**4. `src/pages/Grupos.tsx`** — extrair o conteúdo principal num componente reutilizável `GruposTabContent` (ou simplesmente importar a página inteira como sub-componente da aba). Mais simples: criar `src/components/torneios/GruposTab.tsx` com o conteúdo atual de `Grupos.tsx`, e fazer `Grupos.tsx` virar wrapper que redireciona para `/torneios?tab=grupos`.

**5. Botões "Criar"**: na aba ativa, o botão do header muda:
- Aba Avulsos → "Novo Torneio" (vai para `/torneios/novo`)
- Aba Grupos → "Criar grupo" (vai para `/grupos/novo`)

**6. Links internos** que apontam para `/grupos` (ex.: notificações, GrupoCard de volta) — manter funcionando via redirect.

## Resultado
- Sidebar mais enxuta (1 item a menos).
- Tudo sobre torneios em um lugar só, com toggle Avulsos/Grupos.
- URLs antigas continuam funcionando.
