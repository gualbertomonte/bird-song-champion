import { useState } from 'react';
import { X, Check, Egg } from 'lucide-react';
import { toast } from 'sonner';
import { Bird, Nest } from '@/types/bird';
import { DIAMETROS_PADRAO, DIAMETRO_POR_ESPECIE } from '@/data/anilhas';

export interface FilhoteParcialForm {
  nome: string;
  codigo_anilha: string;
  sexo: 'M' | 'F' | 'I';
  tipo_anilha: 'Fechada' | 'Aberta';
  diametro_anilha: string;
  nasceu: boolean;
}

interface Props {
  nest: Nest;
  mae?: Bird;
  pai?: Bird;
  jaEclodidos: number;
  onCancel: () => void;
  onConfirm: (filhotes: FilhoteParcialForm[], dataNascimento: string) => Promise<void>;
}

function EclosaoParcialModalImpl({ nest, mae, pai, jaEclodidos, onCancel, onConfirm }: Props) {
  const especie = mae?.nome_cientifico || pai?.nome_cientifico || '';
  const diametroPadrao = DIAMETRO_POR_ESPECIE[especie] || '3.0mm';
  const restantes = Math.max(0, nest.quantidade_ovos - jaEclodidos);

  const makeRow = (i: number): FilhoteParcialForm => ({
    nome: '',
    codigo_anilha: `PEND-${Date.now().toString().slice(-4)}${i}`,
    sexo: 'I',
    tipo_anilha: 'Fechada',
    diametro_anilha: diametroPadrao,
    nasceu: true,
  });

  const [dataNasc, setDataNasc] = useState(new Date().toISOString().split('T')[0]);
  // Mostra um filhote por ovo restante; criador desmarca os que ainda não nasceram
  const [filhotes, setFilhotes] = useState<FilhoteParcialForm[]>(
    Array.from({ length: restantes }, (_, i) => makeRow(i))
  );
  const [saving, setSaving] = useState(false);

  const updateRow = (i: number, patch: Partial<FilhoteParcialForm>) =>
    setFilhotes(filhotes.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const marcados = filhotes.filter(f => f.nasceu);

  const handleConfirm = async () => {
    if (marcados.length === 0) {
      toast.error('Marque pelo menos um filhote que nasceu');
      return;
    }
    if (!dataNasc) {
      toast.error('Informe a data de nascimento');
      return;
    }
    const codigos = marcados.map(f => f.codigo_anilha.trim());
    if (codigos.some(c => !c)) {
      toast.error('Filhotes marcados precisam de código de anilha');
      return;
    }
    if (new Set(codigos).size !== codigos.length) {
      toast.error('Códigos de anilha duplicados');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(marcados, dataNasc);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="font-bold text-xl">Registrar Nascimentos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mae?.nome} × {pai?.nome} · já nasceram {jaEclodidos} de {nest.quantidade_ovos} · {restantes} ovo(s) restante(s)
            </p>
          </div>
          <button onClick={onCancel}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Data do nascimento *</label>
            <input
              type="date"
              value={dataNasc}
              onChange={e => setDataNasc(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1 input-field max-w-xs"
            />
          </div>

          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
            ✅ Marque os filhotes que <strong>já nasceram</strong>. Desmarque os ovos que ainda não eclodiram — eles continuam na incubação.
          </p>

          {filhotes.map((f, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border space-y-2 transition-opacity ${
                f.nasceu ? 'bg-success/5 border-success/30' : 'bg-muted/10 border-border opacity-60'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={f.nasceu}
                  onChange={e => updateRow(i, { nasceu: e.target.checked })}
                  className="w-4 h-4 rounded accent-success cursor-pointer"
                />
                <span className="text-xs font-semibold">
                  {f.nasceu ? `Filhote ${i + 1} — nasceu` : `Ovo ${i + 1} — ainda não nasceu`}
                </span>
                {!f.nasceu && <Egg className="w-3.5 h-3.5 text-muted-foreground ml-auto" />}
              </label>

              {f.nasceu && (
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
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={handleConfirm} disabled={saving || marcados.length === 0} className="btn-primary disabled:opacity-50">
            <Check className="w-4 h-4" /> {saving ? 'Salvando...' : `Registrar ${marcados.length} nascimento(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export const EclosaoParcialModal = EclosaoParcialModalImpl;
