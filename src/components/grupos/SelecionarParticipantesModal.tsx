import { useState, useMemo, useEffect } from 'react';
import { X, Check, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Membro {
  user_id: string;
  nome: string;
  email: string;
  ja_inscrito: boolean;
}

interface Props {
  bateriaId: string;
  grupoId: string;
  inscricoesUserIds: string[];
  onClose: () => void;
  onDone?: () => void;
}

export function SelecionarParticipantesModal({ bateriaId, grupoId, inscricoesUserIds, onClose, onDone }: Props) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: m } = await supabase
        .from('torneio_grupo_membros')
        .select('user_id')
        .eq('grupo_id', grupoId)
        .eq('status', 'Ativo');
      const ids = (m || []).map(x => x.user_id);
      if (ids.length === 0) { setMembros([]); setLoading(false); return; }
      const [{ data: profs }, { data: criadores }] = await Promise.all([
        supabase.from('profiles').select('user_id, email, display_name').in('user_id', ids),
        supabase.from('criador_profile').select('user_id, nome_criadouro').in('user_id', ids),
      ]);
      const lookup = new Map<string, { nome: string; email: string }>();
      (profs || []).forEach(p => lookup.set(p.user_id, { nome: p.display_name || p.email, email: p.email }));
      (criadores || []).forEach(c => {
        const cur = lookup.get(c.user_id);
        if (cur && c.nome_criadouro) cur.nome = c.nome_criadouro;
      });
      const list: Membro[] = ids.map(uid => ({
        user_id: uid,
        nome: lookup.get(uid)?.nome || 'Criador',
        email: lookup.get(uid)?.email || '',
        ja_inscrito: inscricoesUserIds.includes(uid),
      }));
      setMembros(list);
      setLoading(false);
    })();
  }, [grupoId, inscricoesUserIds]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return membros;
    return membros.filter(m => m.nome.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [membros, busca]);

  const toggle = (uid: string) =>
    setSelecionados(s => (s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid]));

  const confirmar = async () => {
    if (selecionados.length === 0) return;
    setSalvando(true);
    const { data, error } = await supabase.rpc('convidar_membros_evento', {
      _bateria_id: bateriaId,
      _user_ids: selecionados,
    });
    setSalvando(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${data ?? selecionados.length} participante(s) adicionado(s)`);
    onDone?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-t-2xl md:rounded-2xl border border-border w-full md:max-w-md max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="heading-serif font-semibold">Selecionar participantes</h3>
            <p className="text-[11px] text-muted-foreground">{selecionados.length} selecionado(s)</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar membro"
              className="input-field text-sm pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum membro encontrado</p>
          ) : filtrados.map(m => {
            const sel = selecionados.includes(m.user_id);
            const desabilitado = m.ja_inscrito;
            return (
              <button
                key={m.user_id}
                type="button"
                disabled={desabilitado}
                onClick={() => toggle(m.user_id)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  desabilitado ? 'opacity-50 cursor-not-allowed border-border' :
                  sel ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/40'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${
                  sel ? 'border-secondary bg-secondary' : 'border-muted-foreground/40'
                }`}>
                  {sel && <Check className="w-3 h-3 text-secondary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                {desabilitado && <span className="text-[10px] text-muted-foreground">já inscrito</span>}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-border bg-card">
          <button
            disabled={salvando || selecionados.length === 0}
            onClick={confirmar}
            className="w-full btn-primary justify-center disabled:opacity-40"
          >
            {salvando ? 'Adicionando…' : `Confirmar ${selecionados.length} participante(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
