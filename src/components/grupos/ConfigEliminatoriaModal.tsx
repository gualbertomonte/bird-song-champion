import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Bateria } from '@/types/grupo';

interface Props {
  bateria: Bateria;
  onClose: () => void;
}

export function ConfigEliminatoriaModal({ bateria, onClose }: Props) {
  const [classifDur, setClassifDur] = useState(bateria.classif_duracao_min ?? 10);
  const [corte, setCorte] = useState(bateria.classif_corte_minimo ?? 20);
  const [finalDur, setFinalDur] = useState(bateria.final_duracao_min ?? 15);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    const { error } = await supabase.rpc('definir_formato_eliminatoria', {
      _bateria_id: bateria.id,
      _classif_duracao: classifDur,
      _classif_corte: corte,
      _final_duracao: finalDur,
    });
    setSalvando(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Formato eliminatória configurado');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-t-2xl md:rounded-2xl border border-border w-full md:max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-secondary" />
            <h3 className="heading-serif font-semibold">Eliminatória em 2 fases</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Fase 1 (Classificatória): aves abaixo do mínimo são eliminadas.
            Fase 2 (Final): vence quem cantar mais entre as classificadas.
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Duração da classificatória (min)</label>
            <input
              type="number"
              min={1}
              value={classifDur}
              onChange={e => setClassifDur(parseInt(e.target.value) || 0)}
              className="input-field mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Mínimo de cantos para classificar</label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={corte}
              onChange={e => setCorte(parseFloat(e.target.value) || 0)}
              className="input-field mt-1"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Ex: 20 — quem cantar menos de 20 é eliminado</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Duração da final (min)</label>
            <input
              type="number"
              min={1}
              value={finalDur}
              onChange={e => setFinalDur(parseInt(e.target.value) || 0)}
              className="input-field mt-1"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            disabled={salvando}
            onClick={salvar}
            className="w-full btn-primary justify-center disabled:opacity-40"
          >
            {salvando ? 'Salvando…' : 'Salvar configuração'}
          </button>
        </div>
      </div>
    </div>
  );
}
