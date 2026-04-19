

User pediu "todas as melhorias possíveis". Isso é amplo demais para uma única execução segura. Vou propor um plano em fases priorizáveis para o usuário escolher por onde começar.

## Diagnóstico geral

Áreas com potencial de melhoria identificadas:

**Visual residual** — várias páginas (Plantel, Saude, Bercario, Grupos, Torneios, Emprestimos, Amigos, Perfil, modais) ainda usam classes cruas (`bg-primary`, `text-primary`, `bg-secondary/10`) que ficaram apagadas após a mudança de tema.

**UX/Acessibilidade** — empty states inconsistentes, loadings variados, ações destrutivas sem confirmação, foco/teclado pouco trabalhados.

**Performance** — sem code-splitting, sem `staleTime` no React Query, imagens sem lazy loading, listas grandes sem paginação.

**Funcionalidades faltantes** — busca/filtro no Plantel, exportar PDF, toggle light/dark, PWA offline.

## Plano em 4 fases (escolher por onde começar)

### Fase A — Polimento visual
Varredura nas páginas principais trocando classes cruas pelas variantes padronizadas (`btn-primary`, `btn-outline-gold`, `btn-danger`, `card-premium`). Padronizar empty states e skeletons. Garantir contraste consistente em todo o app.

### Fase B — UX e acessibilidade
- `AlertDialog` em ações destrutivas (deletar ave, encerrar evento, sair do grupo).
- Toasts mais informativos com contexto de erro.
- Indicador visual de scroll horizontal em tabelas (ranking, plantel).
- Foco visível e Esc/Enter nos modais.

### Fase C — Performance
- `React.lazy` + `Suspense` no `App.tsx` (code-splitting por rota).
- `staleTime: 30_000` global no `QueryClient`.
- `loading="lazy"` em fotos de aves.
- Paginação simples no Plantel (20 por página) se houver muitas aves.

### Fase D — Funcionalidades novas (escolher 1 ou 2)
- **Busca/filtro no Plantel** — campo por nome/anilha + filtros por espécie, sexo, status.
- **Exportar PDF** — ranking acumulado do grupo e resultado de evento.
- **Toggle light/dark** — salva preferência no perfil.
- **PWA offline** — service worker para leitura sem internet.

## Recomendação

Sugiro executar **Fase A + Fase C juntas** primeiro (são as de maior impacto visual e técnico, com baixo risco), depois Fase B, e por último escolher 1 funcionalidade da Fase D.

## Próximo passo

Confirme qual(is) fase(s) executar primeiro. Se aprovar "Fase A + C" sem mais comentários, eu sigo com essas duas. Se quiser priorizar diferente (ex: "só visual" ou "só performance" ou "tudo de uma vez aceitando o risco"), é só dizer.

