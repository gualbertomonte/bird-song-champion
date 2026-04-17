import { useState } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Bird, Nest } from '@/types/bird';
import { DIAMETROS_PADRAO, DIAMETRO_POR_ESPECIE } from '@/data/anilhas';

interface FilhoteForm {
  nome: string;
  codigo_anilha: string;
  sexo: 'M' | 'F' | 'I';
  tipo_anilha: 'Fechada' | 'Aberta';
  diametro_anilha: string;
}

interface Props {
  nest: Nest;
  mae?: Bird;
  pai?: Bird;
  onCancel: () => void;
  onConfirm: (filhotes: FilhoteForm[]) => Promise<void>;
}

function EclosaoLoteModalImpl({ nest, mae, pai, onCancel, onConfirm }: Props) {
  const especie = mae?.nome_cientifico || pai?.nome_cientifico || '';
  const diametroPadrao = DIAMETRO_POR_ESPECIE[especie] || '3.0mm';

  const makeRow = (i: number): FilhoteForm => ({
    nome: '',
    codigo_anilha: `PEND-${Date.now().toString().slice(-4)}${i}`,
    sexo: 'I',
    tipo_anilha: 'Fechada',
    diametro_anilha: diametroPadrao,
  });

  const [filhotes, setFilhotes] = useState<FilhoteForm[]>(
    Array.from({ length: nest.quantidade_ovos }, (_, i) => makeRow(i))
  );
  const [saving, setSaving] = useState(false);

  const addRow = () => setFilhotes([...filhotes, makeRow(filhotes.length)]);
  const removeRow = (i: number) => setFilhotes(filhotes.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<FilhoteForm>) =>
    setFilhotes(filhotes.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const handleConfirm = async () => {
    if (filhotes.length === 0) {
      toast.error('Adicione pelo menos um filhote ou cancele');
      return;
    }
    const codigos = filhotes.map(f => f.codigo_anilha.trim());
    if (codigos.some(c => !c)) {
      toast.error('Todos os filhotes precisam de código de anilha');
      return;
    }
    if (new Set(codigos).size !== codigos.length) {
      toast.error('Códigos de anilha duplicados');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(filhotes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="font-bold text-xl">Registrar Eclosão</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mae?.nome} × {pai?.nome} · {nest.quantidade_ovos} ovos
            </p>
          </div>
          <button onClick={onCancel}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filhotes.map((f, i) => (
            <div key={i} className="p-3 rounded-lg border bg-muted/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Filhote {i + 1}</span>
                {filhotes.length > 1 && (
                  <button onClick={() => removeRow(i)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-medium text-muted-foreground">Anilha *</label>
                  <input
                    value={f.codigo_anilha}
                    onChange={e => updateRow(i, { codigo_anilha: e.target.value.toUpperCase() })}
                    className="mt-0.5 input-field text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-medium text-muted-foreground">Sexo</label>
                  <select value={f.sexo} onChange={e => updateRow(i, { sexo: e.target.value as any })} className="mt-0.5 input-field text-sm">
                    <option value="I">Indef.</option>
                    <option value="M">Macho</option>
                    <option value="F">Fêmea</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-medium text-muted-foreground">Tipo</label>
                  <select value={f.tipo_anilha} onChange={e => updateRow(i, { tipo_anilha: e.target.value as any })} className="mt-0.5 input-field text-sm">
                    <option>Fechada</option>
                    <option>Aberta</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-medium text-muted-foreground">Diâmetro</label>
                  <select value={f.diametro_anilha} onChange={e => updateRow(i, { diametro_anilha: e.target.value })} className="mt-0.5 input-field text-sm">
                    {DIAMETROS_PADRAO.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-5">
                  <label className="text-[10px] uppercase font-medium text-muted-foreground">Nome (opcional)</label>
                  <input
                    value={f.nome}
                    onChange={e => updateRow(i, { nome: e.target.value })}
                    placeholder="Ex: Filhote A"
                    className="mt-0.5 input-field text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addRow} className="w-full py-2 rounded-lg border-2 border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" /> Adicionar filhote
          </button>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={handleConfirm} disabled={saving} className="btn-primary disabled:opacity-50">
            <Check className="w-4 h-4" /> {saving ? 'Salvando...' : `Confirmar ${filhotes.length} filhote(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
