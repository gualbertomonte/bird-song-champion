import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Tournament, TournamentEntry, Evaluation } from '@/types/bird';
import { Trophy, Plus, Medal, Star, X, Check, Users } from 'lucide-react';

export default function Torneios() {
  const { tournaments, birds, addTournament, updateTournament } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [showJudge, setShowJudge] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [judgeForm, setJudgeForm] = useState<{ juizNome: string; notas: Record<string, number> }>({ juizNome: '', notas: {} });
  const [newTournament, setNewTournament] = useState({ nome: '', data: '', especiePermitida: '', numJuizes: 3, criterios: 'Ritmo,Potência,Variedade,Melodia' });

  const createTournament = () => {
    if (!newTournament.nome || !newTournament.data) return;
    const t: Tournament = {
      id: Date.now().toString(),
      nome: newTournament.nome,
      data: newTournament.data,
      especiePermitida: newTournament.especiePermitida,
      numJuizes: newTournament.numJuizes,
      status: 'aberto',
      criterios: newTournament.criterios.split(',').map(c => c.trim()),
      inscricoes: [],
    };
    addTournament(t);
    setShowForm(false);
    setNewTournament({ nome: '', data: '', especiePermitida: '', numJuizes: 3, criterios: 'Ritmo,Potência,Variedade,Melodia' });
  };

  const enrollBird = (tournamentId: string, birdId: string) => {
    const t = tournaments.find(t => t.id === tournamentId);
    const b = birds.find(b => b.id === birdId);
    if (!t || !b || t.inscricoes.some(e => e.aveId === birdId)) return;
    const entry: TournamentEntry = { id: Date.now().toString(), aveId: birdId, aveNome: b.nome, aveAnilha: b.anilha, avaliacoes: [] };
    updateTournament(tournamentId, { inscricoes: [...t.inscricoes, entry] });
  };

  const addEvaluation = (tournamentId: string, entryId: string) => {
    const t = tournaments.find(t => t.id === tournamentId);
    if (!t || !judgeForm.juizNome) return;
    const notas = judgeForm.notas;
    const values = Object.values(notas);
    const media = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const evaluation: Evaluation = { juizNome: judgeForm.juizNome, notas, media };

    const inscricoes = t.inscricoes.map(e => {
      if (e.id !== entryId) return e;
      const avaliacoes = [...e.avaliacoes, evaluation];
      const mediaFinal = avaliacoes.reduce((s, a) => s + a.media, 0) / avaliacoes.length;
      return { ...e, avaliacoes, mediaFinal: Math.round(mediaFinal * 100) / 100 };
    });
    updateTournament(tournamentId, { inscricoes });
    setJudgeForm({ juizNome: '', notas: {} });
    setSelectedEntry(null);
  };

  const getRanking = (t: Tournament) => {
    return [...t.inscricoes].filter(e => e.mediaFinal !== undefined).sort((a, b) => (b.mediaFinal || 0) - (a.mediaFinal || 0));
  };

  const medalColors = ['text-warning', 'text-muted-foreground', 'text-secondary'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="page-title">Torneios de Canto</h1>
          <p className="page-subtitle">{tournaments.length} torneios cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity self-start">
          <Plus className="w-4 h-4" /> Novo Torneio
        </button>
      </div>

      {/* Tournaments */}
      <div className="space-y-6">
        {tournaments.map(t => {
          const ranking = getRanking(t);
          const availableBirds = birds.filter(b => b.status === 'ativo' && (!t.especiePermitida || b.especie === t.especiePermitida) && !t.inscricoes.some(e => e.aveId === b.id));

          return (
            <div key={t.id} className="bg-card rounded-xl border overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="p-5 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <h2 className="font-heading font-bold text-xl flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-secondary" /> {t.nome}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.especiePermitida || 'Todas as espécies'} · {new Date(t.data).toLocaleDateString('pt-BR')} · {t.numJuizes} juízes · Critérios: {t.criterios.join(', ')}
                    </p>
                  </div>
                  <span className={`badge-status self-start ${t.status === 'aberto' ? 'bg-success/10 text-success' : t.status === 'finalizado' ? 'bg-muted text-muted-foreground' : 'bg-warning/10 text-warning'}`}>
                    {t.status === 'aberto' ? 'Aberto' : t.status === 'finalizado' ? 'Finalizado' : 'Em andamento'}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Ranking / Podium */}
                {ranking.length > 0 && (
                  <div>
                    <h3 className="font-heading font-semibold mb-3 flex items-center gap-2"><Medal className="w-4 h-4" /> Ranking</h3>
                    <div className="space-y-2">
                      {ranking.map((entry, i) => (
                        <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? 'bg-warning/5 border border-warning/20' : 'bg-muted/30'}`}>
                          <span className={`text-lg font-bold font-heading ${medalColors[i] || 'text-muted-foreground'}`}>
                            {i < 3 ? <Star className="w-5 h-5 fill-current" /> : `${i + 1}º`}
                          </span>
                          <div className="flex-1">
                            <span className="font-medium text-sm">{entry.aveNome}</span>
                            <span className="text-xs text-muted-foreground ml-2">{entry.aveAnilha}</span>
                          </div>
                          <span className="font-heading font-bold text-lg">{entry.mediaFinal?.toFixed(2)}</span>
                          <button
                            onClick={() => { setShowJudge(t.id); setSelectedEntry(entry.id); setJudgeForm({ juizNome: '', notas: Object.fromEntries(t.criterios.map(c => [c, 5])) }); }}
                            className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >Avaliar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entries without scores */}
                {t.inscricoes.filter(e => !e.mediaFinal).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Aguardando avaliação</h3>
                    <div className="flex flex-wrap gap-2">
                      {t.inscricoes.filter(e => !e.mediaFinal).map(entry => (
                        <div key={entry.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 text-sm">
                          <span>{entry.aveNome} ({entry.aveAnilha})</span>
                          <button
                            onClick={() => { setShowJudge(t.id); setSelectedEntry(entry.id); setJudgeForm({ juizNome: '', notas: Object.fromEntries(t.criterios.map(c => [c, 5])) }); }}
                            className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20"
                          >Avaliar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enroll bird */}
                {t.status === 'aberto' && availableBirds.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <select
                      onChange={e => { if (e.target.value) { enrollBird(t.id, e.target.value); e.target.value = ''; } }}
                      className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                    >
                      <option value="">Inscrever ave...</option>
                      {availableBirds.map(b => <option key={b.id} value={b.id}>{b.anilha} – {b.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Judge modal */}
      {showJudge && selectedEntry && (() => {
        const t = tournaments.find(t => t.id === showJudge);
        if (!t) return null;
        return (
          <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => { setShowJudge(null); setSelectedEntry(null); }}>
            <div className="bg-card rounded-2xl border shadow-xl w-full max-w-md p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h2 className="font-heading font-bold text-xl">Avaliação</h2>
                <button onClick={() => { setShowJudge(null); setSelectedEntry(null); }}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome do Juiz</label>
                <input value={judgeForm.juizNome} onChange={e => setJudgeForm({ ...judgeForm, juizNome: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              {t.criterios.map(c => (
                <div key={c}>
                  <label className="text-xs font-medium text-muted-foreground">{c} (0-10)</label>
                  <input type="range" min={0} max={10} step={0.5} value={judgeForm.notas[c] || 5}
                    onChange={e => setJudgeForm({ ...judgeForm, notas: { ...judgeForm.notas, [c]: Number(e.target.value) } })}
                    className="w-full mt-1 accent-primary" />
                  <span className="text-sm font-bold">{judgeForm.notas[c] || 5}</span>
                </div>
              ))}
              <button onClick={() => addEvaluation(showJudge, selectedEntry)}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Enviar Avaliação
              </button>
            </div>
          </div>
        );
      })()}

      {/* New tournament modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-lg p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl">Novo Torneio</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome do Torneio *</label>
                <input value={newTournament.nome} onChange={e => setNewTournament({ ...newTournament, nome: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data *</label>
                <input type="date" value={newTournament.data} onChange={e => setNewTournament({ ...newTournament, data: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Espécie Permitida</label>
                <input value={newTournament.especiePermitida} onChange={e => setNewTournament({ ...newTournament, especiePermitida: e.target.value })}
                  placeholder="Deixe vazio para todas"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Número de Juízes</label>
                <input type="number" value={newTournament.numJuizes} onChange={e => setNewTournament({ ...newTournament, numJuizes: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Critérios (separados por vírgula)</label>
                <input value={newTournament.criterios} onChange={e => setNewTournament({ ...newTournament, criterios: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={createTournament} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2">
                <Check className="w-4 h-4" /> Criar Torneio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
