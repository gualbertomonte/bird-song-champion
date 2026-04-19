

User quer melhorar o Dashboard (rota `/`). Já vi o arquivo `Dashboard.tsx` no contexto. Vou propor melhorias visuais e funcionais alinhadas ao novo sistema de cores/botões padronizados.

## Diagnóstico atual

O Dashboard tem boa estrutura, mas:
1. **Saudação genérica** — só "Bom dia, [criadouro]" sem contexto útil.
2. **Stats cards** repetem o mesmo ícone `TrendingUp` decorativo sem significado.
3. **Distribuição do plantel** — pie chart pequeno, ocupa metade da tela mas mostra pouca info.
4. **Alertas de saúde** misturam vermifugação + ovos incubando no mesmo card (confuso).
5. **Ranking interno** mostra média, mas não destaca a ave campeã visualmente.
6. **FAB** funciona, mas atalhos "Nova Ave / Torneio / Ninhada" poderiam ser mais visíveis em desktop.
7. **Falta visão temporal** — sem gráfico de evolução (torneios por mês, eclosões, etc.).
8. **Cores antigas** — usa `text-success`, `text-info` etc. com fundos `bg-secondary/10` que ficaram apagados após a mudança de tema clara.

## Plano de melhorias

### 1. Hero do dashboard mais informativo
- Saudação + nome do criadouro + data de hoje.
- 3 mini-métricas inline: total de aves, evolução vs. mês passado, próximos eventos.
- Botão CTA primário "Nova ave" no canto direito (desktop), substituindo parcialmente o FAB.

### 2. Stats cards repaginados
- Trocar ícone decorativo `TrendingUp` por **delta real** (ex: "+3 esta semana" em verde).
- Aumentar contraste do número (já usa `number-serif`, melhorar tamanho).
- Cada card vira link clicável para a página correspondente (Plantel, Berçário, Torneios).
- Adicionar 1 card extra: **"Alertas Ativos"** (saúde + doses atrasadas) para chamar atenção.

### 3. Reorganizar grid principal em 3 colunas (desktop)
```text
┌──────────────┬──────────────┬──────────────┐
│ Distribuição │  Próximas    │  Doses hoje  │
│ do plantel   │  eclosões    │  (pendentes) │
└──────────────┴──────────────┴──────────────┘
┌──────────────────────────┬──────────────────┐
│  Ranking top 5 aves      │  Alertas saúde   │
│  (com pódio visual)      │  (só vermífugo)  │
└──────────────────────────┴──────────────────┘
┌─────────────────────────────────────────────┐
│  Atividade dos últimos 30 dias              │
│  (gráfico de linha: torneios + eclosões)    │
└─────────────────────────────────────────────┘
```

### 4. Pódio do ranking
Top 3 aves em destaque visual (1º maior + medalha dourada, 2º prata, 3º bronze), seguidos de 4º e 5º em formato lista compacta.

### 5. Gráfico temporal novo
Linha simples com 2 séries (torneios registrados + eclosões) nos últimos 30 dias usando Recharts (já instalado).

### 6. Aplicar novo sistema de cores
- Trocar `bg-secondary/10` apagado por `bg-card` + `border` mais visível.
- Usar `btn-primary`, `btn-outline-gold` nos CTAs.
- Garantir que `text-muted-foreground` esteja com o novo contraste alto.
- Estados hover claros em todos os cards clicáveis (`hover:border-secondary/40 hover:shadow-md`).

### 7. FAB simplificado
Manter só em mobile (já tem `md:bottom-6`). Em desktop, atalhos ficam no hero como botões visíveis.

## Arquivos afetados
- `src/pages/Dashboard.tsx` — refator principal.
- Possivelmente novo componente `src/components/dashboard/AtividadeChart.tsx` para encapsular o gráfico temporal.
- Possivelmente novo `src/components/dashboard/PodiumRanking.tsx` para o pódio.

## Sem mudanças de banco
Tudo usa dados já disponíveis em `useAppState()` (birds, tournaments, healthRecords, nests). Nenhuma migração ou RPC necessária.

## Compatibilidade
Mantém todas as rotas e links existentes. Só melhora visual e adiciona 1 gráfico novo.

