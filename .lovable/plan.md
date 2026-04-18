
User quer dois recursos no evento (bateria):

1. **Selecionar quem participa** do evento (admin convida/escolhe membros).
2. **Eliminatórias com 2 fases configuráveis** pelo admin:
   - Fase 1 (Classificatória): duração X min, corte por mínimo de cantos (ex: 10 min, corte <20).
   - Fase 2 (Final): só os classificados, duração Y min, vence quem cantar mais.
3. **Ajustar o teclado de pontuação** para refletir as fases (pontuar fase 1, ver corte, pontuar fase 2).

## Plano

### Backend (1 migration)

**Novas colunas em `torneio_baterias`:**
- `formato text default 'simples'` — `'simples'` (atual) ou `'eliminatoria'`
- `fase_atual text default 'unica'` — `'classificatoria' | 'final' | 'unica'`
- `classif_duracao_min int` (ex: 10)
- `classif_corte_minimo numeric` (ex: 20) — quem fizer abaixo é eliminado
- `final_duracao_min int` (ex: 15)

**Nova coluna em `bateria_inscricoes`:**
- `convidado_pelo_admin boolean default false` — marca participantes selecionados pelo admin
- `pontos_classif numeric` — cantos da fase 1 (mantém histórico)
- `pontos_final numeric` — cantos da fase 2
- `classificado_final boolean default false` — passou para a final

**Novas RPCs:**
- `convidar_membros_evento(_bateria_id, _user_ids uuid[])` — admin pré-cria inscrições "Aprovadas + convidado_pelo_admin" para os membros escolhidos (cada um depois associa a ave dele OU admin associa direto se já tiver bird_id padrão).
- `definir_formato_eliminatoria(_bateria_id, _classif_duracao, _classif_corte, _final_duracao)` — só admin, salva config.
- `aplicar_corte_classificatoria(_bateria_id)` — marca `classificado_final=true` para inscrições com `pontos_classif >= classif_corte_minimo` e muda `fase_atual='final'`.
- `registrar_pontuacao_fase(_inscricao_id, _pontos, _fase)` — substitui o atual; grava em `pontos_classif` ou `pontos_final` conforme `_fase`. Mantém `bateria_pontuacoes.pontos = classif + final` para o ranking acumulado continuar funcionando.

### Frontend

**`BateriaDetalhe.tsx` (admin):**
- Novo bloco "Configuração do evento" (visível só pra admin antes de iniciar):
  - Toggle "Eliminatória em 2 fases"
  - Inputs: duração classificatória, corte mínimo, duração final
  - Botão "Selecionar participantes" → modal lista membros do grupo com checkbox; salva via `convidar_membros_evento`
- Card de "Fase atual" + botão "Aplicar corte e iniciar final" (quando estiver em classificatória)
- Lista de inscrições mostra coluna "Fase 1 / Fase 2 / Status (Eliminado / Classificado)"

**`PontuarBateria.tsx` (mobile, fullscreen):**
- Header novo: badge da fase atual ("Classificatória 10 min" ou "Final 15 min") com timer opcional
- Ao salvar, chama `registrar_pontuacao_fase` com a fase atual
- Indicador visual: aves abaixo do corte aparecem com ⚠️ "abaixo do corte"
- Na fase final, lista só aparece com classificados (filter `classificado_final=true`)
- Botão "Aplicar corte" no header (só admin) que dispara `aplicar_corte_classificatoria` e troca a tela para mostrar só os classificados
- Mostra ranking ao vivo embaixo: top 3 por pontos da fase atual

**Novo componente `SelecionarParticipantesModal.tsx`:**
- Lista membros ativos do grupo + checkbox + busca
- Botão "Confirmar X participantes"

### Compatibilidade
- Eventos antigos (`formato='simples'`) seguem funcionando normalmente.
- Quem é `convidado_pelo_admin=true` aparece já como Aprovada; o membro só precisa associar uma ave (ou o admin pode associar).
- Para evitar quebrar o ranking acumulado, `bateria_pontuacoes.pontos` continua sendo a fonte de verdade (=classif+final).

### Resumo do que muda na pontuação
Antes: 1 número por ave.
Depois: 
- Tela mostra fase atual ("Classificatória" / "Final") em destaque.
- Teclado idêntico, mas o número vai pro campo certo (classif ou final).
- Aves eliminadas são puladas automaticamente na fase final.
- Botão grande "Aplicar corte" no fim da fase 1.

### Arquivos
- **Migration**: novas colunas + 4 RPCs + atualização de `registrar_pontuacao_bateria` (alias) + atualização de `get_ranking_acumulado_grupo` (sem mudança, soma via `bateria_pontuacoes`)
- **`src/types/grupo.ts`**: novos campos
- **`src/pages/BateriaDetalhe.tsx`**: bloco de config + seleção de participantes + ações de fase
- **`src/pages/PontuarBateria.tsx`**: header de fase, filtro por fase, botão "aplicar corte"
- **Novo `src/components/grupos/SelecionarParticipantesModal.tsx`**
- **Novo `src/components/grupos/ConfigEliminatoriaModal.tsx`**
- **`src/integrations/supabase/types.ts`**: regenerado automaticamente
