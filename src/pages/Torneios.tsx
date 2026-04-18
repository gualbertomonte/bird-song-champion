import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, Plus, Calendar, Users, History, Users2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTorneiosList } from '@/hooks/useTorneios';
import type { TorneioStatus } from '@/types/torneio';
import GruposTab from '@/components/torneios/GruposTab';

const statusColors: Record<TorneioStatus, string> = {
  'Rascunho': 'bg-muted text-muted-foreground',
  'Inscricoes': 'bg-secondary/15 text-secondary',
  'Sorteado': 'bg-accent/15 text-accent',
  'Em andamento': 'bg-primary/15 text-primary',
  'Encerrado': 'bg-foreground/10 text-foreground',
};

export default function Torneios() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') === 'grupos' ? 'grupos' : 'avulsos') as 'avulsos' | 'grupos';
  const { torneios, loading } = useTorneiosList();
  const [filter, setFilter] = useState<'todos' | 'organizando' | 'participando' | 'encerrados'>('todos');

  const filtered = useMemo(() => {
    return torneios.filter(t => {
      if (filter === 'organizando') return t.organizer_user_id === user?.id;
      if (filter === 'participando') return t.organizer_user_id !== user?.id;
      if (filter === 'encerrados') return t.status === 'Encerrado';
      return true;
    });
  }, [torneios, filter, user?.id]);

  const setTab = (t: 'avulsos' | 'grupos') => {
    if (t === 'avulsos') setSearchParams({});
    else setSearchParams({ tab: 'grupos' });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">Competição colaborativa</p>
          <h1 className="page-title">Torneios</h1>
          <p className="page-subtitle">
            {tab === 'avulsos'
              ? `${torneios.length} torneios · organizador ou participante`
              : 'Comunidades fixas com baterias e ranking acumulado'}
          </p>
        </div>
        <div className="flex gap-2 self-start flex-wrap">
          {tab === 'avulsos' ? (
            <>
              <Link to="/historico-torneios" className="btn-ghost">
                <History className="w-4 h-4" /> Histórico
              </Link>
              <button onClick={() => navigate('/torneios/novo')} className="btn-primary">
                <Plus className="w-4 h-4" /> Novo Torneio
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/grupos/novo')} className="btn-primary">
              <Plus className="w-4 h-4" /> Criar Grupo
            </button>
          )}
        </div>
      </div>

      {/* Tabs Avulsos / Grupos */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 w-fit">
        <button
          onClick={() => setTab('avulsos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            tab === 'avulsos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trophy className="w-4 h-4" /> Avulsos
        </button>
        <button
          onClick={() => setTab('grupos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            tab === 'grupos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users2 className="w-4 h-4" /> Grupos
        </button>
      </div>

      {tab === 'grupos' ? (
        <GruposTab />
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {(['todos', 'organizando', 'participando', 'encerrados'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === f ? 'bg-secondary text-secondary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-center py-12 text-sm text-muted-foreground">Carregando…</p>
          ) : filtered.length === 0 ? (
            <div className="card-premium p-10 text-center">
              <Trophy className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum torneio ainda. Crie o primeiro!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(t => (
                <Link key={t.id} to={`/torneios/${t.id}`} className="card-premium p-5 hover:border-secondary/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <Trophy className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold ${statusColors[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                  <h3 className="heading-serif font-semibold text-lg mb-2 line-clamp-1">{t.nome}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(t.data).toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.numero_estacoes} estacas</span>
                  </div>
                  {t.organizer_user_id === user?.id && (
                    <p className="text-[10px] uppercase tracking-wider mt-3 text-secondary font-semibold">Organizando</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
