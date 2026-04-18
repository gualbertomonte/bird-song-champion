import { useState, useMemo } from 'react';
import { X, Check, Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppState } from '@/context/AppContext';
import { toast } from 'sonner';

interface Props {
  bateriaId: string;
  onClose: () => void;
  onDone?: () => void;
}

export function PedirParticiparEventoModal({ bateriaId, onClose, onDone }: Props) {
  const { birds } = useAppState();
  const [busca, setBusca] = useState('');
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const disponiveis = useMemo(
    () => birds.filter(b => b.sexo === 'M' && b.loan_status === 'proprio'),
    [birds],
  );

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return disponiveis;
    return disponiveis.filter(b =>
      (b.nome || '').toLowerCase().includes(q) ||
      (b.codigo_anilha || '').toLowerCase().includes(q),
    );
  }, [disponiveis, busca]);

  const toggle = (id: string) =>
    setSelecionadas(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const enviar = async () => {
    if (selecionadas.length === 0) return;
    setSalvando(true);
    let ok = 0, fail = 0;
    for (const bid of selecionadas) {
      const { error } = await supabase.rpc('inscrever_ave_bateria', { _bateria_id: bateriaId, _bird_id: bid });
      if (error) { fail++; console.error(error); } else ok++;
    }
    setSalvando(false);
    if (ok > 0) toast.success(`Pedido enviado (${ok} ave) — aguardando aprovação do admin`);
    if (fail > 0) toast.error(`${fail} falharam`);
    onDone?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border w-full sm:max-w-md max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="heading-serif font-semibold">Pedir para participar</h3>
            <p className="text-[11px] text-muted-foreground">Selecione a(s) ave(s) que deseja inscrever</p>
          </div>
          <button onClick={onClose} aria-label="Fechar"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {disponiveis.length > 0 && (
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome ou anilha" className="input-field text-sm pl-9" />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {disponiveis.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum macho disponível no seu plantel</p>
          ) : filtradas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nada encontrado</p>
          ) : filtradas.map(b => {
            const sel = selecionadas.includes(b.id);
            return (
              <button key={b.id} type="button" onClick={() => toggle(b.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  sel ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/40'
                }`}>
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
          <button disabled={salvando || selecionadas.length === 0} onClick={enviar} className="w-full btn-primary justify-center disabled:opacity-40 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> {salvando ? 'Enviando…' : `Enviar pedido (${selecionadas.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
