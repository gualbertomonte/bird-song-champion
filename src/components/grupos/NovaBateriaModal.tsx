import { useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  grupoId: string;
  regulamentoPadrao?: string | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export default function NovaBateriaModal({ grupoId, regulamentoPadrao, onClose, onCreated }: Props) {
  const [nome, setNome] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [numEstacoes, setNumEstacoes] = useState(10);
  const [regulamento, setRegulamento] = useState(regulamentoPadrao || '');
  const [salvando, setSalvando] = useState(false);

  const submit = async () => {
    if (!nome.trim()) { toast.error('Informe o nome'); return; }
    setSalvando(true);
    try {
      const { data: id, error } = await supabase.rpc('criar_bateria', {
        _grupo_id: grupoId,
        _nome: nome.trim(),
        _data: data,
        _numero_estacoes: numEstacoes,
        _regulamento: regulamento || null,
      });
      if (error) throw error;
      toast.success('Evento criado!');
      onCreated(id as string);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSalvando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-t-2xl md:rounded-2xl border border-border w-full md:max-w-md max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="heading-serif font-semibold">Novo evento</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome</label>
            <input value={nome} onChange={e => setNome(e.target.value)} className="input-field" placeholder="Ex: Bateria 1 - Sábado" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nº estações</label>
              <input type="number" min={1} value={numEstacoes} onChange={e => setNumEstacoes(parseInt(e.target.value) || 1)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Regulamento (opcional)</label>
            <textarea value={regulamento} onChange={e => setRegulamento(e.target.value)} rows={4} className="input-field" placeholder="Herda do grupo se vazio" />
          </div>
        </div>
        <div className="p-4 border-t border-border bg-card">
          <button disabled={salvando} onClick={submit} className="w-full btn-primary flex items-center justify-center gap-2">
            <CalendarPlus className="w-4 h-4" />
            Criar evento
          </button>
        </div>
      </div>
    </div>
  );
}
