import { useState, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { Trophy, Plus, X, Check, Medal, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export default function Torneios() {
  const { tournaments, birds, addTournament, deleteTournament } = useAppState();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [filterBird, setFilterBird] = useState('');
  const [form, setForm] = useState({ bird_id: '', data: '', nome_torneio: '', clube: '', pontuacao: 500, classificacao: '' });

  useEffect(() => { if (searchParams.get('new') === '1') setShowForm(true); }, [searchParams]);

  const activeBirds = birds.filter(b => (b.status === 'Ativo' || b.status === 'Berçário') && b.sexo === 'M');

  const filtered = useMemo(() => {
    let result = [...tournaments];
    if (filterBird) result = result.filter(t => t.bird_id === filterBird);
    return result.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [tournaments, filterBird]);

  const ranking = useMemo(() => {
    const map = new Map<string, { total: number; count: number; best: number }>();
    tournaments.forEach(t => {
      const existing = map.get(t.bird_id) || { total: 0, count: 0, best: 0 };
      map.set(t.bird_id, {
        total: existing.total + Number(t.pontuacao || 0),
        count: existing.count + 1,
        best: Math.max(existing.best, Number(t.pontuacao || 0)),
      });
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({
        bird: birds.find(b => b.id === id),
        avg: data.count > 0 ? data.total / data.count : 0,
        total: data.total,
        best: data.best,
        count: data.count,
      }))
      .filter(r => r.bird)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
  }, [tournaments, birds]);

  const save = () => {
    if (!form.bird_id || !form.data || !form.nome_torneio) {
      toast.error('Preencha ave, data e nome do torneio');
      return;
    }
    if (form.pontuacao < 1 || form.pontuacao > 1000) {
      toast.error('Pontuação deve ser entre 1 e 1000');
      return;
    }
    addTournament({ ...form, id: Date.now().toString(), created_at: new Date().toISOString() });
    setForm({ bird_id: '', data: '', nome_torneio: '', clube: '', pontuacao: 500, classificacao: '' });
    setShowForm(false);
    toast.success('Torneio registrado!');
  };

  const medalColor = (i: number) => i === 0 ? 'text-secondary' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-orange-400' : 'text-muted-foreground';

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">Competição</p>
          <h1 className="page-title">Torneios</h1>
          <p className="page-subtitle">{tournaments.length} participações registradas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary self-start">
          <Plus className="w-4 h-4" /> Registrar Torneio
        </button>
      </div>

      {ranking.length > 0 && (
        <div className="card-premium p-5 animate-fade-in">
          <h2 className="heading-serif font-semibold text-lg mb-4 flex items-center gap-2">
            <Medal className="w-4 h-4 text-secondary" /> Ranking Interno (Top 10)
          </h2>
          <div className="space-y-2">
            {ranking.map((item, i) => (
              <div key={item.bird!.id} className={`flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-lg ${i === 0 ? 'bg-secondary/5 border border-secondary/15' : 'bg-muted/20'}`}>
                <span className={`text-base sm:text-lg font-bold w-7 sm:w-8 text-center shrink-0 ${medalColor(i)}`}>{i + 1}º</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.bird!.nome}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {item.bird!.codigo_anilha} · {item.count} {item.count === 1 ? 'torneio' : 'torneios'} · melhor {item.best.toFixed(0)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-base sm:text-lg text-secondary leading-none">{item.avg.toFixed(1)}</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">média</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select value={filterBird} onChange={e => setFilterBird(e.target.value)} className="input-field w-full sm:w-auto sm:min-w-[200px]">
          <option value="">Todas as aves</option>
          {activeBirds.map(b => <option key={b.id} value={b.id}>{b.nome} ({b.codigo_anilha})</option>)}
        </select>
      </div>

      <div className="card-premium overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Torneio</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Ave</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Clube</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Pts</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Classificação</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const bird = birds.find(b => b.id === t.bird_id);
                return (
                  <tr key={t.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs sm:text-sm">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 font-medium text-xs sm:text-sm">{t.nome_torneio}</td>
                    <td className="p-3 text-xs sm:text-sm">{bird?.nome || '—'}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{t.clube || '—'}</td>
                    <td className="p-3 font-bold text-secondary">{t.pontuacao}</td>
                    <td className="p-3 hidden sm:table-cell">{t.classificacao || '—'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => { deleteTournament(t.id); toast.success('Removido'); }} className="btn-ghost p-1.5 text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">Nenhum torneio registrado</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">Registrar Torneio</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ave *</label>
                <select value={form.bird_id} onChange={e => setForm({ ...form, bird_id: e.target.value })} className="mt-1 input-field">
                  <option value="">Selecionar ave...</option>
                  {activeBirds.map(b => <option key={b.id} value={b.id}>{b.nome} ({b.codigo_anilha})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome do Torneio *</label>
                <input value={form.nome_torneio} onChange={e => setForm({ ...form, nome_torneio: e.target.value })} className="mt-1 input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Data *</label>
                  <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="mt-1 input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Clube</label>
                  <input value={form.clube} onChange={e => setForm({ ...form, clube: e.target.value })} className="mt-1 input-field" />
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Pontuação (1-1000)</label>
                  <span className="text-sm font-bold text-secondary">{form.pontuacao}</span>
                </div>
                <input type="range" min={1} max={1000} step={1} value={form.pontuacao}
                  onChange={e => setForm({ ...form, pontuacao: Number(e.target.value) })}
                  className="w-full mt-1 accent-secondary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Classificação</label>
                <input value={form.classificacao} onChange={e => setForm({ ...form, classificacao: e.target.value })} className="mt-1 input-field" placeholder="1º Lugar, Finalista..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={save} className="btn-primary"><Check className="w-4 h-4" /> Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
