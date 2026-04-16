import { useAppState } from '@/context/AppContext';
import { Heart, Plus, Pill, Calendar, AlertCircle, X, Check, Syringe, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const tiposOptions = ['Vermifugação', 'Vacina', 'Exame', 'Vitamina', 'Tratamento', 'Cirurgia', 'Outro'];

export default function Saude() {
  const { healthRecords, birds, addHealthRecord, deleteHealthRecord } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bird_id: '', data: '', tipo: 'Vermifugação', descricao: '', proxima_dose: '' });

  const activeBirds = birds.filter(b => b.status === 'Ativo' || b.status === 'Berçário');
  const today = new Date();

  const upcoming = healthRecords
    .filter(h => h.proxima_dose && new Date(h.proxima_dose) > today)
    .sort((a, b) => new Date(a.proxima_dose!).getTime() - new Date(b.proxima_dose!).getTime());

  const recent = [...healthRecords].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const getBird = (id: string) => birds.find(b => b.id === id);

  const save = () => {
    if (!form.bird_id || !form.data || !form.tipo) {
      toast.error('Preencha ave, data e tipo');
      return;
    }
    addHealthRecord({
      id: Date.now().toString(),
      bird_id: form.bird_id,
      data: form.data,
      tipo: form.tipo,
      descricao: form.descricao || undefined,
      proxima_dose: form.proxima_dose || undefined,
    });
    setForm({ bird_id: '', data: '', tipo: 'Vermifugação', descricao: '', proxima_dose: '' });
    setShowForm(false);
    toast.success('Registro de saúde adicionado!');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="page-title">Saúde</h1>
          <p className="page-subtitle">{healthRecords.length} registros</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary self-start">
          <Plus className="w-4 h-4" /> Novo Registro
        </button>
      </div>

      {upcoming.length > 0 && (
        <div className="bg-card rounded-xl border p-5 animate-fade-in">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-secondary" /> Próximas Doses
          </h2>
          <div className="space-y-2">
            {upcoming.map(h => {
              const bird = getBird(h.bird_id);
              const days = Math.ceil((new Date(h.proxima_dose!).getTime() - today.getTime()) / 86400000);
              return (
                <div key={h.id} className={`flex items-center gap-3 p-3 rounded-lg ${days <= 7 ? 'bg-destructive/5 border border-destructive/15' : 'bg-secondary/5 border border-secondary/10'}`}>
                  <Pill className={`w-4 h-4 ${days <= 7 ? 'text-destructive' : 'text-secondary'} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bird?.nome} — {h.tipo}</p>
                    <p className="text-xs text-muted-foreground truncate">{h.descricao}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium">{new Date(h.proxima_dose!).toLocaleDateString('pt-BR')}</p>
                    <p className={`text-xs ${days <= 7 ? 'text-destructive' : 'text-secondary'}`}>em {days} dias</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border overflow-hidden animate-fade-in">
        <div className="p-4 border-b bg-muted/10">
          <h2 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Histórico Completo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/10">
                <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Ave</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Descrição</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Próx. Dose</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(h => {
                const bird = getBird(h.bird_id);
                return (
                  <tr key={h.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs sm:text-sm">{new Date(h.data).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 font-medium text-xs sm:text-sm">{bird?.nome || '—'}</td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">{h.tipo}</span></td>
                    <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">{h.descricao || '—'}</td>
                    <td className="p-3 text-xs hidden sm:table-cell">{h.proxima_dose ? new Date(h.proxima_dose).toLocaleDateString('pt-BR') : '—'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => { deleteHealthRecord(h.id); toast.success('Removido'); }} className="btn-ghost p-1.5 text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {recent.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">Nenhum registro de saúde</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">Novo Registro de Saúde</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Data *</label>
                  <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="mt-1 input-field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="mt-1 input-field">
                    {tiposOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} className="mt-1 input-field resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Próxima Dose</label>
                <input type="date" value={form.proxima_dose} onChange={e => setForm({ ...form, proxima_dose: e.target.value })} className="mt-1 input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={save} className="btn-primary"><Check className="w-4 h-4" /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
