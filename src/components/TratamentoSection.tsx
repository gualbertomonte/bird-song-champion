import { useState, useMemo } from 'react';
import { useTratamentos } from '@/hooks/useTratamentos';
import { useAppState } from '@/context/AppContext';
import { Pill, Plus, X, Check, Loader2, Calendar, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const viasOptions = ['Oral', 'Injetável', 'Tópica', 'Ocular', 'Inalação'];

export default function TratamentoSection() {
  const { birds } = useAppState();
  const { treatments, doses, loading, criarTratamento, marcarAplicada, cancelarTratamento, excluirTratamento } = useTratamentos();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    bird_id: '',
    medicamento: '',
    dosagem: '',
    via: 'Oral',
    data_inicio: new Date().toISOString().slice(0, 10),
    duracao_dias: 7,
    frequencia_diaria: 1,
    hora_primeira: '08:00',
    observacoes: '',
  });

  const activeBirds = birds.filter(b => b.status === 'Ativo' || b.status === 'Berçário');

  const ativos = treatments.filter(t => t.status === 'Ativo');
  const inativos = treatments.filter(t => t.status !== 'Ativo');

  const dosesByTreatment = useMemo(() => {
    const map = new Map<string, typeof doses>();
    for (const d of doses) {
      const arr = map.get(d.treatment_id) || [];
      arr.push(d);
      map.set(d.treatment_id, arr);
    }
    return map;
  }, [doses]);

  const totalDosesPreview = form.duracao_dias * form.frequencia_diaria;

  const submit = async () => {
    if (!form.bird_id || !form.medicamento.trim()) {
      toast.error('Selecione a ave e informe o medicamento');
      return;
    }
    setSubmitting(true);
    try {
      await criarTratamento({
        bird_id: form.bird_id,
        medicamento: form.medicamento.trim(),
        dosagem: form.dosagem,
        via: form.via,
        data_inicio: form.data_inicio,
        duracao_dias: form.duracao_dias,
        frequencia_diaria: form.frequencia_diaria,
        hora_primeira: form.hora_primeira,
        observacoes: form.observacoes,
      });
      setShowForm(false);
      setForm({
        bird_id: '', medicamento: '', dosagem: '', via: 'Oral',
        data_inicio: new Date().toISOString().slice(0, 10),
        duracao_dias: 7, frequencia_diaria: 1, hora_primeira: '08:00', observacoes: '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar tratamento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="heading-serif font-semibold text-lg flex items-center gap-2">
          <Pill className="w-4 h-4 text-secondary" /> Tratamentos Medicamentosos
          {ativos.length > 0 && <span className="text-xs text-muted-foreground font-normal">· {ativos.length} ativo(s)</span>}
        </h2>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-2 px-3">
          <Plus className="w-3.5 h-3.5" /> Novo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-secondary" /></div>
      ) : (
        <>
          {ativos.length === 0 && inativos.length === 0 ? (
            <div className="card-premium p-6 text-center text-sm text-muted-foreground">
              <Pill className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhum tratamento cadastrado
            </div>
          ) : (
            <div className="space-y-2">
              {[...ativos, ...inativos].map(t => {
                const bird = birds.find(b => b.id === t.bird_id);
                const ds = dosesByTreatment.get(t.id) || [];
                const aplicadas = ds.filter(d => d.aplicada_em).length;
                const total = ds.length;
                const pct = total ? (aplicadas / total) * 100 : 0;
                const isExpanded = expanded === t.id;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                const dosesHoje = ds.filter(d => {
                  const dt = new Date(d.data_prevista);
                  return dt >= today && dt < tomorrow;
                });

                return (
                  <div key={t.id} className={`card-premium overflow-hidden ${t.status !== 'Ativo' ? 'opacity-60' : ''}`}>
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.status === 'Ativo' ? 'bg-secondary/15 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                          <Pill className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{t.medicamento}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {bird?.nome} · {t.frequencia_diaria}x/dia · {t.duracao_dias} dias
                                {t.dosagem && ` · ${t.dosagem}`}
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                              t.status === 'Ativo' ? 'bg-secondary/15 text-secondary' :
                              t.status === 'Concluido' ? 'bg-success/15 text-success' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {t.status}
                            </span>
                          </div>

                          {/* Progresso */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-muted-foreground">{aplicadas}/{total} doses</span>
                              <span className="font-medium">{Math.round(pct)}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-secondary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>

                          {/* Doses de hoje (alerta) */}
                          {t.status === 'Ativo' && dosesHoje.some(d => !d.aplicada_em) && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive bg-destructive/5 border border-destructive/15 rounded-lg px-2 py-1.5">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{dosesHoje.filter(d => !d.aplicada_em).length} dose(s) pendente(s) hoje</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => setExpanded(isExpanded ? null : t.id)}
                              className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? 'Ocultar' : 'Ver'} doses
                            </button>
                            {t.status === 'Ativo' && (
                              <button
                                onClick={() => { if (confirm('Cancelar este tratamento?')) cancelarTratamento(t.id).catch(e => toast.error(e.message)); }}
                                className="text-xs text-muted-foreground hover:text-destructive ml-auto"
                              >
                                Cancelar
                              </button>
                            )}
                            {t.status !== 'Ativo' && (
                              <button
                                onClick={() => { if (confirm('Excluir tratamento e histórico?')) excluirTratamento(t.id).catch(e => toast.error(e.message)); }}
                                className="text-xs text-destructive ml-auto inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/40 bg-muted/5 max-h-72 overflow-y-auto">
                        {ds.map(d => {
                          const dt = new Date(d.data_prevista);
                          const isPast = dt < new Date() && !d.aplicada_em;
                          const isToday = dt >= today && dt < tomorrow;
                          return (
                            <div key={d.id} className={`flex items-center gap-2 px-3 py-2 text-xs border-b border-border/20 last:border-0 ${
                              d.aplicada_em ? 'opacity-50' : isPast ? 'bg-destructive/5' : isToday ? 'bg-secondary/5' : ''
                            }`}>
                              <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">
                                  {dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </span>
                                <span className="text-muted-foreground ml-2">
                                  {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {d.aplicada_em && (
                                  <span className="text-success ml-2 inline-flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {new Date(d.aplicada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              {!d.aplicada_em && t.status === 'Ativo' && (
                                <button
                                  onClick={() => marcarAplicada(d.id).catch(e => toast.error(e.message))}
                                  className="px-2 py-1 rounded-md bg-success/15 text-success hover:bg-success/25 transition-colors inline-flex items-center gap-1 font-medium"
                                >
                                  <Check className="w-3 h-3" /> Aplicar
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-card rounded-t-2xl sm:rounded-2xl border shadow-2xl w-full sm:max-w-md max-h-[92vh] flex flex-col animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60 flex-shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Pill className="w-4 h-4 text-secondary" /> Novo Tratamento
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ave *</label>
                <select value={form.bird_id} onChange={e => setForm({ ...form, bird_id: e.target.value })} className="input-field mt-1">
                  <option value="">Selecionar ave...</option>
                  {activeBirds.map(b => <option key={b.id} value={b.id}>{b.nome} ({b.codigo_anilha})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Medicamento *</label>
                <input
                  type="text"
                  value={form.medicamento}
                  onChange={e => setForm({ ...form, medicamento: e.target.value })}
                  placeholder="Ex: Enrofloxacina"
                  className="input-field mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Dosagem</label>
                  <input
                    type="text"
                    value={form.dosagem}
                    onChange={e => setForm({ ...form, dosagem: e.target.value })}
                    placeholder="Ex: 0,1ml"
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Via</label>
                  <select value={form.via} onChange={e => setForm({ ...form, via: e.target.value })} className="input-field mt-1">
                    {viasOptions.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Início *
                  </label>
                  <input
                    type="date"
                    value={form.data_inicio}
                    onChange={e => setForm({ ...form, data_inicio: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Hora 1ª dose
                  </label>
                  <input
                    type="time"
                    value={form.hora_primeira}
                    onChange={e => setForm({ ...form, hora_primeira: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Duração (dias) *</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.duracao_dias}
                    onChange={e => setForm({ ...form, duracao_dias: parseInt(e.target.value) || 1 })}
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Frequência (x/dia)</label>
                  <select
                    value={form.frequencia_diaria}
                    onChange={e => setForm({ ...form, frequencia_diaria: parseInt(e.target.value) })}
                    className="input-field mt-1"
                  >
                    {[1, 2, 3, 4, 6, 8, 12].map(n => <option key={n} value={n}>{n}x ao dia</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  rows={2}
                  className="input-field mt-1 resize-none"
                  placeholder="Indicação, cuidados, etc."
                />
              </div>

              <div className="text-xs bg-info/5 border border-info/15 rounded-lg p-2.5 text-muted-foreground">
                💡 Serão geradas <strong className="text-foreground">{totalDosesPreview} doses</strong> automaticamente
                ({form.duracao_dias} dias × {form.frequencia_diaria}x/dia, intervalo de ~{Math.round(24 / form.frequencia_diaria)}h).
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 sm:p-5 border-t border-border/60 flex-shrink-0 bg-card">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={submit} disabled={submitting} className="btn-primary disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Criar tratamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
