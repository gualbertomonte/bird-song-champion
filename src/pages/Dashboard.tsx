import { useAppState } from '@/context/AppContext';
import { Bird, Trophy, Heart, Egg, TrendingUp, Calendar, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useState } from 'react';

export default function Dashboard() {
  const { birds, tournaments, healthRecords, nests, profile } = useAppState();
  const [showFab, setShowFab] = useState(false);

  const ativas = birds.filter(b => b.status === 'Ativo').length;
  const bercario = birds.filter(b => b.status === 'Berçário').length;
  const machos = birds.filter(b => b.sexo === 'M' && (b.status === 'Ativo' || b.status === 'Berçário')).length;
  const femeas = birds.filter(b => b.sexo === 'F' && (b.status === 'Ativo' || b.status === 'Berçário')).length;
  const ovosIncubando = nests.filter(n => n.status === 'Incubando').reduce((s, n) => s + n.quantidade_ovos, 0);
  const torneiosMes = tournaments.filter(t => {
    const d = new Date(t.data);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const proximasVermifugacoes = healthRecords
    .filter(h => h.proxima_dose && !h.aplicada_em)
    .sort((a, b) => new Date(a.proxima_dose!).getTime() - new Date(b.proxima_dose!).getTime())
    .slice(0, 5);

  const stats = [
    { label: 'Aves Ativas', value: ativas, icon: Bird, color: 'text-success' },
    { label: 'No Berçário', value: bercario, icon: Egg, color: 'text-info' },
    { label: 'Ovos Incubando', value: ovosIncubando, icon: Egg, color: 'text-secondary' },
    { label: 'Torneios (mês)', value: torneiosMes, icon: Trophy, color: 'text-secondary' },
  ];

  const pieData = [
    { name: 'Machos', value: machos, color: 'hsl(155, 50%, 22%)' },
    { name: 'Fêmeas', value: femeas, color: 'hsl(43, 74%, 52%)' },
    { name: 'Berçário', value: bercario, color: 'hsl(200, 80%, 50%)' },
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

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Olá, {profile.nome_criadouro}! 👋</h1>
          <p className="page-subtitle">Aqui está o resumo do seu plantel</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{s.value}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-5 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="font-semibold text-lg mb-4">Distribuição do Plantel</h2>
          {pieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(150, 15%, 10%)', border: '1px solid hsl(150, 10%, 16%)', borderRadius: '8px', color: 'hsl(120, 5%, 92%)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-sm">{d.name}: <span className="font-semibold">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Cadastre aves para ver a distribuição.</p>
          )}
        </div>

        <div className="bg-card rounded-xl border p-5 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" /> Alertas de Saúde
            <Link to="/saude" className="ml-auto text-xs text-secondary hover:underline font-normal">Ver todos</Link>
          </h2>
          <div className="space-y-3">
            {proximasVermifugacoes.length > 0 ? proximasVermifugacoes.map(h => {
              const bird = birds.find(b => b.id === h.bird_id);
              const days = Math.ceil((new Date(h.proxima_dose!).getTime() - Date.now()) / 86400000);
              const isOverdue = days < 0;
              const isSoon = days >= 0 && days <= 7;
              return (
                <Link to="/saude" key={h.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isOverdue ? 'bg-destructive/10 border border-destructive/25 hover:bg-destructive/15' : isSoon ? 'bg-destructive/5 border border-destructive/15 hover:bg-destructive/10' : 'bg-muted/30 hover:bg-muted/50'}`}>
                  <Heart className={`w-4 h-4 flex-shrink-0 ${isOverdue || isSoon ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bird?.nome} — {h.tipo}</p>
                    <p className="text-xs text-muted-foreground truncate">{h.descricao || 'Sem descrição'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium whitespace-nowrap">{new Date(h.proxima_dose!).toLocaleDateString('pt-BR')}</p>
                    <p className={`text-[10px] ${isOverdue || isSoon ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isOverdue ? `vencida há ${Math.abs(days)}d` : days === 0 ? 'hoje' : `em ${days}d`}
                    </p>
                  </div>
                </Link>
              );
            }) : (
              <p className="text-sm text-muted-foreground">Nenhuma dose pendente. 🎉</p>
            )}
            {nests.filter(n => n.status === 'Incubando').slice(0, 2).map(n => {
              const femea = birds.find(b => b.id === n.femea_id);
              return (
                <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg bg-info/5 border border-info/10">
                  <Egg className="w-4 h-4 text-info flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Ninhada de {femea?.nome}</p>
                    <p className="text-xs text-muted-foreground">{n.quantidade_ovos} ovos incubando</p>
                  </div>
                  <span className="text-xs text-info font-medium whitespace-nowrap">
                    {new Date(n.data_postura).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-5 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Trophy className="w-4 h-4 text-secondary" /> Ranking Interno
          </h2>
          <Link to="/torneios" className="text-sm text-secondary hover:underline flex items-center gap-1">
            Ver todos <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {topBirds.length > 0 ? (
          <div className="space-y-2">
            {topBirds.map((item, i) => (
              <div key={item.bird_id} className={`flex items-center gap-3 sm:gap-4 p-3 rounded-lg ${i === 0 ? 'bg-secondary/5 border border-secondary/15' : 'bg-muted/20'}`}>
                <span className={`text-lg font-bold w-8 text-center ${i === 0 ? 'text-secondary' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                  {i + 1}º
                </span>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.bird?.foto_url ? <img src={item.bird.foto_url} className="w-full h-full object-cover" /> : <Bird className="w-4 h-4 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.bird?.nome}</p>
                  <p className="text-xs text-muted-foreground">{item.count} torneios · Média {item.avg} pts</p>
                </div>
                <span className="font-bold text-lg text-secondary">{item.avg}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Registre torneios para ver o ranking.</p>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40">
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
        <button onClick={() => setShowFab(!showFab)} className="fab">
          <Plus className={`w-6 h-6 transition-transform duration-200 ${showFab ? 'rotate-45' : ''}`} />
        </button>
      </div>
    </div>
  );
}
