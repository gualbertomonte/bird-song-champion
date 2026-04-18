import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Shuffle, Lock, CheckCircle2, X, Trophy, Medal, Award, Zap, Share2, Check, Users, Scissors } from 'lucide-react';
import { useBateria } from '@/hooks/useBateria';
import { useAuth } from '@/context/AuthContext';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calcularClassificacaoBateria } from '@/types/grupo';
import { SelecionarParticipantesModal } from '@/components/grupos/SelecionarParticipantesModal';
import { ConfigEliminatoriaModal } from '@/components/grupos/ConfigEliminatoriaModal';

type Tab = 'inscricoes' | 'sorteio' | 'pontuacao' | 'classificacao';

export default function BateriaDetalhe() {
  const { id, bateriaId } = useParams<{ id: string; bateriaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { birds } = useAppState();
  const { bateria, grupo, inscricoes, pontuacoes, loading } = useBateria(bateriaId);
  const [tab, setTab] = useState<Tab>('inscricoes');
  const [showInscrever, setShowInscrever] = useState(false);
  const [showParticipantes, setShowParticipantes] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  if (loading) return <p className="text-sm text-muted-foreground text-center py-12">Carregando…</p>;
  if (!bateria || !grupo) return <p className="text-sm text-muted-foreground text-center py-12">Evento não encontrado</p>;

  const isAdmin = grupo.admin_user_id === user?.id;
  const minhasInscricoes = inscricoes.filter(i => i.membro_user_id === user?.id);
  const aprovadas = inscricoes.filter(i => i.status === 'Aprovada');
  const classificacao = calcularClassificacaoBateria(inscricoes, pontuacoes);
  const aceitaInscricao = ['Agendada', 'Inscricoes'].includes(bateria.status);
  const isElim = bateria.formato === 'eliminatoria';
  const podeConfigurar = isAdmin && ['Agendada', 'Inscricoes', 'Sorteada'].includes(bateria.status);

  const compartilharLink = async () => {
    const url = `${window.location.origin}/p/bateria/${bateria.id}`;
    const texto = `🏆 ${bateria.nome} — ${grupo.nome}\nVer classificação ao vivo:\n${url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    if (navigator.share) {
      try { await navigator.share({ title: bateria.nome, text: texto, url }); return; } catch {}
    }
    window.open(wa, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <button onClick={() => navigate(`/grupos/${id}`)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> {grupo.nome}
      </button>

      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="heading-serif text-2xl md:text-3xl font-semibold">{bateria.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(bateria.data + 'T00:00').toLocaleDateString('pt-BR')} · {bateria.numero_estacoes} estacas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            bateria.status === 'Encerrada' ? 'bg-muted text-muted-foreground' :
            bateria.status === 'Em andamento' ? 'bg-secondary/20 text-secondary' :
            'bg-accent/20 text-accent-foreground'
          }`}>{bateria.status}</span>
          <button onClick={compartilharLink} className="text-xs px-3 py-1 rounded-lg border border-secondary/30 text-secondary hover:bg-secondary/10 flex items-center gap-1">
            <Share2 className="w-3 h-3" /> Compartilhar
          </button>
          {isAdmin && bateria.status !== 'Encerrada' && (
            <button onClick={async () => {
              if (!confirm('Encerrar este evento? Pontuação será bloqueada.')) return;
              const { error } = await supabase.rpc('encerrar_bateria', { _bateria_id: bateria.id });
              if (error) toast.error(error.message); else toast.success('Evento encerrado');
            }} className="text-xs px-3 py-1 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Encerrar
            </button>
          )}
        </div>
      </header>

      <div className="flex gap-1 border-b border-border overflow-x-auto no-scrollbar">
        {([
          { key: 'inscricoes', label: `Inscrições (${inscricoes.length})` },
          { key: 'sorteio', label: 'Sorteio' },
          { key: 'pontuacao', label: 'Pontuação' },
          { key: 'classificacao', label: 'Classificação' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'inscricoes' && (
        <section className="space-y-3">
          {aceitaInscricao && (
            <button onClick={() => setShowInscrever(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Inscrever aves
            </button>
          )}
          {inscricoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma inscrição ainda</p>
          ) : (
            <div className="space-y-2">
              {inscricoes.map(ins => (
                <div key={ins.id} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ins.bird_snapshot?.nome}</p>
                    <p className="text-xs text-muted-foreground font-mono">{ins.bird_snapshot?.codigo_anilha}</p>
                    {ins.motivo_rejeicao && <p className="text-[11px] text-destructive mt-1">Rejeitada: {ins.motivo_rejeicao}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    ins.status === 'Aprovada' ? 'bg-secondary/20 text-secondary' :
                    ins.status === 'Rejeitada' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>{ins.status}</span>
                  {isAdmin && ins.status === 'Pendente' && (
                    <div className="flex gap-1">
                      <button onClick={async () => {
                        const { error } = await supabase.rpc('aprovar_inscricao_bateria', { _inscricao_id: ins.id, _aprovar: true });
                        if (error) toast.error(error.message); else toast.success('Aprovada');
                      }} className="p-2 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={async () => {
                        const motivo = prompt('Motivo da rejeição:') || '';
                        const { error } = await supabase.rpc('aprovar_inscricao_bateria', { _inscricao_id: ins.id, _aprovar: false, _motivo: motivo });
                        if (error) toast.error(error.message); else toast.success('Rejeitada');
                      }} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'sorteio' && (
        <section className="space-y-3">
          {isAdmin && bateria.status !== 'Encerrada' && (
            <button onClick={async () => {
              const { error } = await supabase.rpc('sortear_estacoes_bateria', { _bateria_id: bateria.id });
              if (error) toast.error(error.message); else toast.success('Estacas sorteadas!');
            }} className="btn-primary inline-flex items-center gap-2">
              <Shuffle className="w-4 h-4" /> {bateria.status === 'Sorteada' || bateria.status === 'Em andamento' ? 'Refazer sorteio' : 'Sortear estacas'}
            </button>
          )}
          {aprovadas.filter(i => i.estacao).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sorteio ainda não realizado</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr><th className="text-left px-3 py-2">Estaca</th><th className="text-left px-3 py-2">Ave</th><th className="text-left px-3 py-2">Anilha</th></tr>
                </thead>
                <tbody>
                  {[...aprovadas].sort((a, b) => (a.estacao || 0) - (b.estacao || 0)).map(ins => (
                    <tr key={ins.id} className="border-t border-border">
                      <td className="px-3 py-2 font-bold text-secondary">{ins.estacao}</td>
                      <td className="px-3 py-2">{ins.bird_snapshot?.nome}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{ins.bird_snapshot?.codigo_anilha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'pontuacao' && (
        <section className="space-y-3">
          {!isAdmin && <p className="text-xs text-muted-foreground">Apenas o admin do grupo lança pontuação</p>}
          {isAdmin && bateria.status !== 'Encerrada' && aprovadas.some(i => i.estacao) && (
            <button
              onClick={() => navigate(`/grupos/${id}/baterias/${bateriaId}/pontuar`)}
              className="btn-primary inline-flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <Zap className="w-4 h-4" /> Modo rápido (estaca por estaca)
            </button>
          )}
          {aprovadas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem aves aprovadas</p>
          ) : aprovadas.map(ins => {
            const p = pontuacoes.find(x => x.inscricao_id === ins.id);
            return (
              <div key={ins.id} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{ins.bird_snapshot?.nome}</p>
                  <p className="text-xs text-muted-foreground">Estaca {ins.estacao || '—'}</p>
                </div>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={p?.pontos ?? ''}
                  disabled={!isAdmin || bateria.status === 'Encerrada'}
                  onBlur={async (e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) return;
                    const { error } = await supabase.rpc('registrar_pontuacao_bateria', { _inscricao_id: ins.id, _pontos: val });
                    if (error) toast.error(error.message); else toast.success('Pontuação salva');
                  }}
                  className="w-24 input-field text-right"
                  placeholder="0.0"
                />
              </div>
            );
          })}
        </section>
      )}

      {tab === 'classificacao' && (
        <section>
          {classificacao.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem classificação</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr><th className="text-left px-3 py-2">#</th><th className="text-left px-3 py-2">Ave</th><th className="text-left px-3 py-2">Estaca</th><th className="text-right px-3 py-2">Pontos</th></tr>
                </thead>
                <tbody>
                  {classificacao.map(c => {
                    const meu = c.inscricao.membro_user_id === user?.id;
                    return (
                      <tr key={c.inscricao.id} className={`border-t border-border ${meu ? 'bg-secondary/5' : ''}`}>
                        <td className="px-3 py-2.5 font-medium">
                          {c.posicao === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                          {c.posicao === 2 && <Medal className="w-4 h-4 text-gray-400" />}
                          {c.posicao === 3 && <Award className="w-4 h-4 text-orange-500" />}
                          {c.posicao > 3 && c.posicao}
                        </td>
                        <td className="px-3 py-2.5">{c.inscricao.bird_snapshot?.nome}{meu && <span className="ml-2 text-[10px] text-secondary">(sua)</span>}</td>
                        <td className="px-3 py-2.5">{c.inscricao.estacao || '—'}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{c.pontos.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {showInscrever && (
        <InscreverAvesModal
          bateriaId={bateria.id}
          birdsDisponiveis={birds.filter(b => b.sexo === 'M' && b.loan_status === 'proprio' && !minhasInscricoes.find(i => i.bird_id === b.id))}
          onClose={() => setShowInscrever(false)}
        />
      )}
    </div>
  );
}

function InscreverAvesModal({ bateriaId, birdsDisponiveis, onClose }: { bateriaId: string; birdsDisponiveis: any[]; onClose: () => void }) {
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);

  const filtradas = birdsDisponiveis.filter(b => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (b.nome || '').toLowerCase().includes(q) || (b.codigo_anilha || '').toLowerCase().includes(q);
  });

  const toggle = (bid: string) =>
    setSelecionadas(s => (s.includes(bid) ? s.filter(x => x !== bid) : [...s, bid]));

  const todasSelecionadas = filtradas.length > 0 && filtradas.every(b => selecionadas.includes(b.id));
  const toggleTodas = () => {
    if (todasSelecionadas) setSelecionadas(s => s.filter(id => !filtradas.find(b => b.id === id)));
    else setSelecionadas(s => [...new Set([...s, ...filtradas.map(b => b.id)])]);
  };

  const inscrever = async () => {
    if (selecionadas.length === 0) return;
    setSalvando(true);
    let ok = 0, fail = 0;
    for (const bid of selecionadas) {
      const { error } = await supabase.rpc('inscrever_ave_bateria', { _bateria_id: bateriaId, _bird_id: bid });
      if (error) { fail++; console.error(error); } else ok++;
    }
    setSalvando(false);
    if (ok > 0) toast.success(`${ok} ave(s) inscrita(s) — aguardando aprovação`);
    if (fail > 0) toast.error(`${fail} falharam`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-t-2xl md:rounded-2xl border border-border w-full md:max-w-md max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="heading-serif font-semibold">Inscrever aves</h3>
            <p className="text-[11px] text-muted-foreground">{selecionadas.length} selecionada(s)</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {birdsDisponiveis.length > 0 && (
          <div className="p-3 border-b border-border space-y-2">
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou anilha"
              className="input-field text-sm"
            />
            <button
              type="button"
              onClick={toggleTodas}
              className="text-xs text-secondary hover:underline"
            >
              {todasSelecionadas ? 'Desmarcar todas' : 'Selecionar todas'} ({filtradas.length})
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {birdsDisponiveis.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum macho disponível para inscrever</p>
          ) : filtradas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nada encontrado</p>
          ) : filtradas.map(b => {
            const sel = selecionadas.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toggle(b.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  sel ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/40'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${
                  sel ? 'border-secondary bg-secondary' : 'border-muted-foreground/40'
                }`}>
                  {sel && <Check className="w-3 h-3 text-secondary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{b.nome}</p>
                  <p className="text-xs text-muted-foreground font-mono">{b.codigo_anilha}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-border bg-card">
          <button
            disabled={salvando || selecionadas.length === 0}
            onClick={inscrever}
            className="w-full btn-primary justify-center disabled:opacity-40"
          >
            {salvando ? 'Inscrevendo…' : `Inscrever ${selecionadas.length} ave(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
