

## Escopo aprovado pelo usuário

Grande pacote de melhorias em 8 áreas. Vou agrupar por fases para entregar valor incremental sem quebrar nada. Cada fase é independente e testável.

## Fase 1 — Saúde e alertas (alto impacto, dados já existem)

**1.1 Notificações de vermifugação/vacinação vencendo**
- Edge function agendada (pg_cron diário) que varre `health_records.proxima_dose` e cria registros em `notifications` para doses vencendo em ≤7 dias ou já vencidas.
- `NotificationBell` já existe — adicionar contador + lista clicável que linka para a ave.
- Bloco "Alertas de saúde" no Dashboard listando próximas doses (substitui/expande "Próximos Compromissos").

**1.2 Lembretes recorrentes**
- Novo campo `recorrencia_meses` (int, nullable) em `health_records`.
- Ao marcar dose como aplicada (botão novo "Marcar como feita"), se houver recorrência, cria automaticamente próximo registro com `proxima_dose = hoje + N meses`.

**1.3 Timeline clínica em BirdDetail**
- Nova seção "Histórico clínico" em `BirdDetail.tsx` com timeline vertical (ícone + data + tipo + descrição) ordenada por data desc.

## Fase 2 — Berçário e reprodução

**2.1 Cadastro em lote já existe parcialmente**
- O fluxo "Registrar Eclosão" já cria N filhotes. Vou melhorar: modal pós-eclosão permitindo editar nome/sexo/anilha de cada filhote em lista única antes de salvar.

**2.2 Calendário de eclosões previstas**
- Mapa de dias de incubação por espécie em `src/data/anilhas.ts` (curió ~14d, trinca-ferro ~13d, etc.).
- Card no Berçário "Eclosões previstas" mostrando ninhadas incubando ordenadas por data prevista (postura + dias).
- Notificação automática 2 dias antes da data prevista.

**2.3 Taxa de sucesso por casal**
- Card "Desempenho dos casais" no Berçário: agrupa `nests` por par (femea_id+macho_id), mostra total ovos, total filhotes, %.

## Fase 3 — Torneios e desempenho

**3.1 Ranking do plantel** já existe no Dashboard. Vou:
- Mover para página `/torneios` aba "Ranking" com filtro por período (últimos 30/90/365 dias).
- Mostrar evolução (seta ↑↓ vs período anterior).

**3.2 Gráfico de evolução individual**
- Em `BirdDetail`, novo gráfico de linha (recharts) com pontuação por torneio ao longo do tempo.

**3.3 Comparador de aves**
- Nova rota `/torneios/comparar?ids=a,b` — seleciona até 3 aves, mostra lado a lado: pontuação média, total torneios, linhagem (pais), última saúde.

## Fase 4 — Empréstimos e transferências

**4.1 Badges visuais consistentes**
- Componente `<LoanBadge bird={...} />` reutilizável: "Própria" (cinza), "Emprestada" (amarelo), "Recebida" (azul).
- Aplicar em cards do Plantel, Árvore Genealógica, BirdDetail, Empréstimos.

**4.2 Recibo PDF automático**
- Edge function `generate-loan-receipt` usando pdf-lib (Deno) gera PDF com dados do empréstimo + ambas partes + ave.
- Botão "Baixar recibo" na página de Empréstimos.

**4.3 Histórico completo**
- Em `BirdDetail`, seção "Histórico de transferências/empréstimos" lendo `bird_loans` + `pending_transfers` (snapshot) relacionados.

## Fase 5 — Documentação oficial SISPASS

**5.1 Exportar plantel PDF**
- Botão "Exportar SISPASS" em `Plantel.tsx`.
- Edge function `export-plantel-sispass` gera PDF com cabeçalho (criadouro, CTF, data) + tabela: anilha, espécie (científico), sexo, nascimento, status.
- Layout aproximado do formato oficial (precisarei do template real ou seguirei o padrão comum SISPASS).

## Fase 6 — UX / Mobile

**6.1 Câmera direta no upload**
- `PhotoUploader` ganha `capture="environment"` no input de mobile para abrir câmera traseira diretamente.

**6.2 Modo escuro**
- Verificar `index.css`/`tailwind.config.ts` — o app já usa tokens HSL escuros. Adicionar toggle no header se ainda não houver.

**6.3 PWA instalável** ⚠️
- Vou avisar: no preview do Lovable o service worker é desabilitado (interfere no iframe). Funciona apenas no app publicado.
- Adicionar `vite-plugin-pwa` com guarda anti-iframe + manifest com ícones do PlantelPro + `display: standalone`.
- Se você só quer "instalar na home" sem offline, basta manifest simples — me confirme se quer offline real.

## Fase 7 — Inteligência (Lovable AI)

**7.1 Resumo mensal automático**
- Edge function `monthly-summary` (cron mensal dia 1) usa `google/gemini-2.5-flash` para gerar texto curto a partir das estatísticas do mês.
- Cria notificação tipo "resumo" + exibe card no topo do Dashboard no primeiro acesso do mês.

## Ordem de execução proposta

1. **Fase 1** (saúde + notificações) — fundação que destrava várias outras
2. **Fase 4** (badges + recibo PDF) — visual rápido + entrega tangível
3. **Fase 5** (PDF SISPASS) — diferencial competitivo
4. **Fase 2** (berçário ampliado)
5. **Fase 3** (torneios)
6. **Fase 6** (UX mobile)
7. **Fase 7** (IA resumo)

## Mudanças de banco

- `health_records`: adicionar coluna `recorrencia_meses int`, `aplicada_em date nullable`
- `notifications`: já existe, OK
- Habilitar `pg_cron` + `pg_net` para jobs agendados (notificações diárias, resumo mensal)

## Confirmações que preciso

1. Pode começar pela **Fase 1** ou prefere outra ordem?
2. PWA: quer **offline real** (mais complexo) ou só **instalável na home** (manifest simples)?
3. Tem template oficial do PDF SISPASS ou seguimos formato padrão (tabela + cabeçalho)?

