
User está em `/grupos/:id/eventos/:bid` (status "Sorteada", formato simples). Vejo na imagem:
- Aba "Participantes (2)" mostra **2 linhas** porque o mesmo criador (Gualberto) inscreveu 2 aves (FOGUINHO e CHEFINHO).
- "Ferramentas do organizador" só mostra "Formato simples (1 fase)" + botão "Ativar eliminatória" — **não tem botão para adicionar participantes**.

Vou verificar o código de `BateriaDetalhe.tsx` para confirmar onde está o botão "Selecionar participantes" e por que não aparece, e o `ParticipantesEvento.tsx` para entender o agrupamento.

## Diagnóstico

**Problema 1 — botão de adicionar participantes sumiu:**
Provavelmente o botão "Selecionar participantes" está condicionado ao status (`Inscricoes` ou `Agendada`) e some quando o evento já foi sorteado. User quer poder adicionar a qualquer momento (consistente com "editar configuração a qualquer momento" feito antes).

**Problema 2 — nome do criador duplicado:**
`ParticipantesEvento` lista 1 linha por inscrição. Se um criador tem 2 aves, aparecem 2 linhas com o mesmo nome. User quer **agrupar por criador**, mostrando o nome 1 vez e listando as aves abaixo.

## Plano

### Frontend

**`src/pages/BateriaDetalhe.tsx`**
- Botão "Selecionar participantes" (e "Adicionar participante") **sempre visível para admin**, em qualquer status exceto `Encerrada`. Adicionar ao bloco "Ferramentas do organizador" ao lado de "Ativar eliminatória".
- Se status for `Sorteada`/`Em andamento`, mostrar aviso curto: "Novos participantes entrarão sem estação sorteada — refaça o sorteio se necessário."

**`src/components/grupos/ParticipantesEvento.tsx`**
- Agrupar `lista` por `membro_user_id`. Renderizar 1 card por criador com:
  - Header: avatar + nome + código + badge global de status (ex: "convidado pelo admin" se todas).
  - Sub-lista de aves: cada ave em mini-linha com 🐦 nome · anilha · estação · status individual (Aprovada/PendenteAve/Rejeitada) · pontos fase 1/2 se eliminatória · classificada/eliminada.
- Mantém o realtime e contador de aves "(N aves)" ao lado do nome.
- Em mobile, cards empilham; aves viram lista vertical compacta.

### Backend
Nenhuma mudança — RPC `get_participantes_evento` já retorna tudo necessário (1 linha por inscrição, com `membro_user_id` para agrupar no front).

### Resumo
- 1 ajuste em `BateriaDetalhe.tsx`: liberar botão de adicionar participantes a qualquer momento (exceto Encerrada).
- 1 refator em `ParticipantesEvento.tsx`: agrupar por criador.

### Compatibilidade
Sem mudanças de banco. Só UI.
