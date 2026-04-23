import { useAppState } from '@/context/AppContext';
import { Bird, Trophy, Heart, Egg, Plus, ChevronRight, AlertTriangle, Activity, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useState } from 'react';
import DosesHojeCard from '@/components/DosesHojeCard';
import PodiumRanking from '@/components/dashboard/PodiumRanking';
import AtividadeChart from '@/components/dashboard/AtividadeChart';
import AdSenseBanner from '@/components/ads/GoogleAdBanner';
import { useShowAds } from '@/hooks/useShowAds';

export default function Dashboard() {
  const { birds, tournaments, healthRecords, nests, profile } = useAppState();
  const [showFab, setShowFab] = useState(false);
  const showAds = useShowAds();

  const ativas = birds.filter(b => b.status === 'Ativo').length;
  const bercario = birds.filter(b => b.status === 'Berçário').length;
  const machos = birds.filter(b => b.sexo === 'M' && (b.status === 'Ativo' || b.status === 'Berçário')).length;
  const femeas = birds.filter(b => b.sexo === 'F' && (b.status === 'Ativo' || b.status === 'Berçário')).length;
  const ovosIncubando = nests.filter(n => n.status === 'Incubando').reduce((s, n) => s + n.quantidade_ovos, 0);

  // Deltas
  const now = new Date();
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);
  const novasAvesSemana = birds.filter(b => b.created_at && new Date(b.created_at) >= sevenDaysAgo).length;
  const torneiosMes = tournaments.filter(t => {
    const d = new Date(t.data);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const torneiosMesAnterior = tournaments.filter(t => {
    const d = new Date(t.data);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
  }).length;
  const deltaTorneios = torneiosMes - torneiosMesAnterior;

  const proximasVermifugacoes = healthRecords
    .filter(h => h.proxima_dose && !h.aplicada_em)
    .sort((a, b) => new Date(a.proxima_dose!).getTime() - new Date(b.proxima_dose!).getTime())
    .slice(0, 5);

  const alertasAtivos = proximasVermifugacoes.filter(h => {
    const days = Math.ceil((new Date(h.proxima_dose!).getTime() - Date.now()) / 86400000);
    return days <= 7;
  }).length;

  const eclosoesProximas = nests
    .filter(n => n.status === 'Incubando')
    .map(n => {
      const postura = new Date(n.data_postura);
      const previsao = new Date(postura); previsao.setDate(postura.getDate() + 14);
      const diasRestantes = Math.ceil((previsao.getTime() - Date.now()) / 86400000);
      return { nest: n, previsao, diasRestantes };
    })
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, 4);

  const stats = [
    {
      label: 'Aves Ativas',
      value: ativas,
      icon: Bird,
      color: 'text-success',
      bg: 'bg-success/10 border-success/25',
      to: '/plantel',
      delta: novasAvesSemana > 0 ? `+${novasAvesSemana} esta semana` : null,
      deltaPositive: true,
    },
    {
      label: 'No Berçário',
      value: bercario,
      icon: Egg,
      color: 'text-info',
      bg: 'bg-info/10 border-info/25',
      to: '/bercario',
      delta: ovosIncubando > 0 ? `${ovosIncubando} ovos incubando` : null,
      deltaPositive: true,
    },
    {
      label: 'Torneios (mês)',
      value: torneiosMes,
      icon: Trophy,
      color: 'text-secondary',
      bg: 'bg-secondary/10 border-secondary/25',
      to: '/torneios',
      delta: deltaTorneios !== 0 ? `${deltaTorneios > 0 ? '+' : ''}${deltaTorneios} vs mês anterior` : 'Igual ao mês anterior',
      deltaPositive: deltaTorneios >= 0,
    },
    {
      label: 'Alertas Ativos',
      value: alertasAtivos,
      icon: AlertTriangle,
      color: alertasAtivos > 0 ? 'text-destructive' : 'text-muted-foreground',
      bg: alertasAtivos > 0 ? 'bg-destructive/10 border-destructive/25' : 'bg-muted/30 border-border',
      to: '/saude',
      delta: alertasAtivos > 0 ? 'Doses próximas ou vencidas' : 'Tudo em dia',
      deltaPositive: alertasAtivos === 0,
    },
  ];

  const pieData = [
    { name: 'Machos', value: machos, color: 'hsl(155, 50%, 35%)' },
    { name: 'Fêmeas', value: femeas, color: 'hsl(43, 74%, 55%)' },
    { name: 'Berçário', value: bercario, color: 'hsl(200, 80%, 55%)' },
  ].filter(d => d.value > 0);

  const topBirds = [...tournaments]
    .reduce((acc, t) => {
      const existing = acc.find(a => a.bird_id === t.bird_id);
      if (existing) { existing.total += t.pontuacao; existing.count++; }
      else acc.push({ bird_id: t.bird_id, total: t.pontuacao, count: 1 });
      return acc;
    }, [] as { bird_id: string; total: number; count: number }[])
    .map(a => ({ ...a, avg: Math.round(a.total / a.count), bird: birds.find(b => b.id === a.bird_id) }))
    .filter(a => a.bird)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Hero */}
      <div className="card-premium p-5 sm:p-6 bg-gradient-to-br from-card to-card/60">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <p className="label-eyebrow mb-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-secondary" /> {greeting} · {hoje}
            </p>
            <h1 className="page-title truncate">{profile.nome_criadouro}</h1>
            <p className="page-subtitle">
              {birds.length} aves no plantel · {tournaments.length} torneios registrados
            </p>
          </div>
          <div className="hidden md:flex gap-2 flex-shrink-0">
            <Link to="/plantel?new=1" className="btn-primary btn-sm">
              <Bird className="w-4 h-4" /> Nova ave
            </Link>
            <Link to="/torneios?new=1" className="btn-outline-gold btn-sm">
              <Trophy className="w-4 h-4" /> Novo torneio
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <Link
            key={s.label}
            to={s.to}
            className="stat-card group hover:border-secondary/40 hover:shadow-md transition-all animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="number-serif text-3xl sm:text-4xl font-semibold text-foreground">{s.value}</p>
            <p className="label-eyebrow mt-1">{s.label}</p>
            {s.delta && (
              <p className={`text-[11px] mt-1.5 font-medium ${s.deltaPositive ? 'text-success' : 'text-destructive'}`}>
                {s.delta}
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Linha 1: Distribuição | Eclosões | Doses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="card-premium p-5 animate-fade-in">
          <h2 className="heading-serif font-semibold text-base mb-4 flex items-center gap-2">
            <Bird className="w-4 h-4 text-secondary" /> Distribuição do Plantel
          </h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1 min-w-0">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs sm:text-sm">{d.name}</span>
                    <span className="text-xs sm:text-sm font-semibold ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Cadastre aves para ver a distribuição.</p>
          )}
        </div>

        <div className="card-premium p-5 animate-fade-in" style={{ animationDelay: '80ms' }}>
          <h2 className="heading-serif font-semibold text-base mb-4 flex items-center gap-2">
            <Egg className="w-4 h-4 text-info" /> Próximas Eclosões
            <Link to="/bercario" className="ml-auto text-xs text-secondary hover:underline font-normal">Ver</Link>
          </h2>
          {eclosoesProximas.length > 0 ? (
            <div className="space-y-2">
              {eclosoesProximas.map(({ nest, previsao, diasRestantes }) => {
                const femea = birds.find(b => b.id === nest.femea_id);
                const isOverdue = diasRestantes < 0;
                return (
                  <div key={nest.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${isOverdue ? 'bg-destructive/5 border-destructive/20' : 'bg-info/5 border-info/15'}`}>
                    <Egg className={`w-4 h-4 flex-shrink-0 ${isOverdue ? 'text-destructive' : 'text-info'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{femea?.nome ?? 'Ninhada'}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{nest.quantidade_ovos} ovos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs font-medium">{previsao.toLocaleDateString('pt-BR')}</p>
                      <p className={`text-[10px] ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {isOverdue ? `atrasada ${Math.abs(diasRestantes)}d` : diasRestantes === 0 ? 'hoje' : `em ${diasRestantes}d`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma incubação ativa.</p>
          )}
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <DosesHojeCard />
        </div>
      </div>

      {/* Linha 2: Pódio | Alertas saúde */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card-premium p-5 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="heading-serif font-semibold text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-secondary" /> Ranking Interno
            </h2>
            <Link to="/torneios" className="text-xs text-secondary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <PodiumRanking items={topBirds} />
        </div>

        <div className="card-premium p-5 animate-fade-in" style={{ animationDelay: '80ms' }}>
          <h2 className="heading-serif font-semibold text-base mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" /> Próximas Vermifugações
            <Link to="/saude" className="ml-auto text-xs text-secondary hover:underline font-normal">Ver todos</Link>
          </h2>
          <div className="space-y-2">
            {proximasVermifugacoes.length > 0 ? proximasVermifugacoes.map(h => {
              const bird = birds.find(b => b.id === h.bird_id);
              const days = Math.ceil((new Date(h.proxima_dose!).getTime() - Date.now()) / 86400000);
              const isOverdue = days < 0;
              const isSoon = days >= 0 && days <= 7;
              return (
                <Link to="/saude" key={h.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isOverdue ? 'bg-destructive/10 border-destructive/25 hover:bg-destructive/15' : isSoon ? 'bg-destructive/5 border-destructive/15 hover:bg-destructive/10' : 'bg-muted/30 border-border hover:bg-muted/50'}`}>
                  <Heart className={`w-4 h-4 flex-shrink-0 ${isOverdue || isSoon ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{bird?.nome} — {h.tipo}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{h.descricao || 'Sem descrição'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] sm:text-xs font-medium whitespace-nowrap">{new Date(h.proxima_dose!).toLocaleDateString('pt-BR')}</p>
                    <p className={`text-[10px] ${isOverdue || isSoon ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isOverdue ? `vencida há ${Math.abs(days)}d` : days === 0 ? 'hoje' : `em ${days}d`}
                    </p>
                  </div>
                </Link>
              );
            }) : (
              <p className="text-sm text-muted-foreground">Nenhuma dose pendente. 🎉</p>
            )}
          </div>
        </div>
      </div>

      {/* Linha 3: Atividade */}
      <div className="card-premium p-5 animate-fade-in">
        <h2 className="heading-serif font-semibold text-base mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-secondary" /> Atividade dos últimos 30 dias
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Torneios registrados e eclosões diárias.</p>
        <AtividadeChart tournaments={tournaments} nests={nests} />
      </div>

      {/* Banner de anúncio (rodapé do conteúdo) */}
      {showAds && (
        <section
          aria-label="Espaço publicitário"
          className="mt-6 pt-4 border-t border-border/40"
        >
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 text-center mb-2">
            Publicidade
          </p>
          <div className="flex justify-center">
            <AdSenseBanner
              slot="7741257825"
              format="fluid"
              layoutKey="-fb+5w+4e-db+86"
              className="max-w-3xl"
              minHeight={140}
            />
          </div>
        </section>
      )}

      {/* FAB (mobile only) */}
      <div className="fixed bottom-20 right-4 sm:right-6 z-40 md:hidden">
        {showFab && (
          <div className="absolute bottom-16 right-0 bg-card border rounded-xl shadow-xl p-2 space-y-1 w-48 animate-scale-in">
            <Link to="/plantel?new=1" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors" onClick={() => setShowFab(false)}>
              <Bird className="w-4 h-4 text-success" /> Nova Ave
            </Link>
            <Link to="/torneios?new=1" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors" onClick={() => setShowFab(false)}>
              <Trophy className="w-4 h-4 text-secondary" /> Registrar Torneio
            </Link>
            <Link to="/bercario?new=1" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors" onClick={() => setShowFab(false)}>
              <Egg className="w-4 h-4 text-info" /> Nova Ninhada
            </Link>
          </div>
        )}
        <button onClick={() => setShowFab(!showFab)} className="fab" aria-label="Atalhos">
          <Plus className={`w-6 h-6 transition-transform duration-200 ${showFab ? 'rotate-45' : ''}`} />
        </button>
      </div>
    </div>
  );
}
