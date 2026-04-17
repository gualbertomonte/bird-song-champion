

## Objetivo
Permitir que cada usuário personalize a barra de navegação inferior do mobile (escolher quais itens aparecem e em que ordem).

## Proposta

### UX
- Nova seção em **Perfil** → "Barra de Navegação Mobile":
  - Lista de todos os 8 itens disponíveis (Dashboard, Plantel, Árvore, Berçário, Empréstimos, Torneios, Saúde, Perfil) com checkbox de visibilidade.
  - Recomendação visual: 4–6 itens (acima disso fica apertado em telas pequenas).
  - Botão "Restaurar padrão".
  - Preview em tempo real (opcional simples: só salvar e mostrar toast).
- Reordenação: setas ↑ ↓ ao lado de cada item habilitado (drag-and-drop seria overkill agora).

### Persistência
- Coluna nova em `criador_profile`: `mobile_nav_config jsonb` — array de `{ key: string, visible: boolean }` na ordem desejada.
- Carregar junto com o resto do perfil em `AppContext` (já busca `criador_profile`).
- Salvar via update normal do perfil (sem RPC nova; RLS de update do próprio perfil já existe).

### Frontend
- `src/types/bird.ts` ou no `AppContext`: tipo `MobileNavItem = { key: NavKey; visible: boolean }`.
- `AppContext`: expor `mobileNavConfig` + `setMobileNavConfig` (persiste no banco).
- `AppLayout.tsx`: substituir o array hardcoded `mobileNavItems` por `useAppState().mobileNavConfig`, fazendo merge com a definição completa (label/icon/to) e filtrando `visible`. Fallback para padrão se vazio.
- `Perfil.tsx`: novo card "Barra de Navegação Mobile" com lista reordenável + checkboxes + botão restaurar.

### Migration
- `ALTER TABLE criador_profile ADD COLUMN mobile_nav_config jsonb DEFAULT NULL;`
- Sem trigger, sem RLS extra (já protegido).

## Arquivos afetados
- 1 migration (coluna `mobile_nav_config`)
- `src/context/AppContext.tsx` (carregar/salvar config)
- `src/components/AppLayout.tsx` (renderizar dinamicamente)
- `src/pages/Perfil.tsx` (UI de personalização)

## Resultado
Cada usuário vê só os atalhos que escolheu, na ordem que preferir, no menu inferior do celular. Configuração salva na nuvem e sincroniza entre dispositivos.

