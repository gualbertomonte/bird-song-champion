import { useAppState } from '@/context/AppContext';
import { Bird, Trophy, Stethoscope, Activity, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { birds, tournaments, treatments } = useAppState();

  const ativas = birds.filter(b => b.status === 'ativo').length;
  const machos = birds.filter(b => b.sexo === 'macho' && b.status === 'ativo').length;
  const femeas = birds.filter(b => b.sexo === 'fêmea' && b.status === 'ativo').length;
  const torneiosAbertos = tournaments.filter(t => t.status === 'aberto').length;
  const tratAtivos = treatments.filter(t => new Date(t.dataFim) >= new Date()).length;

  const stats = [
    { label: 'Aves Ativas', value: ativas, icon: Bird, color: 'text-primary' },
    { label: 'Machos', value: machos, icon: TrendingUp, color: 'text-info' },
    { label: 'Fêmeas', value: femeas, icon: Activity, color: 'text-secondary' },
    { label: 'Torneios Abertos', value: torneiosAbertos, icon: Trophy, color: 'text-warning' },
    { label: 'Tratamentos Ativos', value: tratAtivos, icon: Stethoscope, color: 'text-destructive' },
    { label: 'Total no Plantel', value: birds.length, icon: Calendar, color: 'text-success' },
  ];

  const recentBirds = birds.filter(b => b.status === 'ativo').slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-48 md:h-56 bg-gradient-to-br from-primary/20 via-card to-secondary/20">
        <div className="absolute inset-0 flex items-center px-6 md:px-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Aves de Fibra</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base font-body">Gestão completa do seu plantel de pássaros</p>
            <div className="flex gap-3 mt-4">
              <Link to="/plantel" className="btn-primary text-xs"><Bird className="w-3.5 h-3.5" /> Meu Plantel</Link>
              <Link to="/torneios" className="btn-secondary text-xs"><Trophy className="w-3.5 h-3.5" /> Torneios</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold font-heading">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick sections */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-semibold text-lg">Aves Recentes</h2>
            <Link to="/plantel" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {recentBirds.map(bird => (
              <div key={bird.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {bird.fotos?.[0] ? <img src={bird.fotos[0]} className="w-full h-full object-cover" /> : <Bird className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{bird.nome}</p>
                  <p className="text-xs text-muted-foreground">{bird.especie} · {bird.anilha}</p>
                </div>
                <span className="badge-active">{bird.sexo === 'macho' ? '♂' : '♀'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-semibold text-lg">Torneios</h2>
            <Link to="/torneios" className="text-sm text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {tournaments.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.especiePermitida} · {new Date(t.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={`badge-status ${t.status === 'aberto' ? 'bg-success/10 text-success' : t.status === 'finalizado' ? 'bg-muted text-muted-foreground' : 'bg-warning/10 text-warning'}`}>
                  {t.status === 'aberto' ? 'Aberto' : t.status === 'finalizado' ? 'Finalizado' : 'Em andamento'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
