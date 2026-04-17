import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Bateria, BateriaInscricao, BateriaPontuacao, TorneioGrupo } from '@/types/grupo';

export function useBateria(bateriaId: string | undefined) {
  const [bateria, setBateria] = useState<Bateria | null>(null);
  const [grupo, setGrupo] = useState<TorneioGrupo | null>(null);
  const [inscricoes, setInscricoes] = useState<BateriaInscricao[]>([]);
  const [pontuacoes, setPontuacoes] = useState<BateriaPontuacao[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!bateriaId) return;
    setLoading(true);
    const { data: b } = await supabase.from('torneio_baterias').select('*').eq('id', bateriaId).maybeSingle();
    setBateria(b as any);
    if (b) {
      const [g, i, p] = await Promise.all([
        supabase.from('torneio_grupos').select('*').eq('id', (b as any).grupo_id).maybeSingle(),
        supabase.from('bateria_inscricoes').select('*').eq('bateria_id', bateriaId).order('created_at'),
        supabase.from('bateria_pontuacoes').select('*').eq('bateria_id', bateriaId),
      ]);
      setGrupo(g.data as any);
      setInscricoes((i.data || []) as any);
      setPontuacoes((p.data || []) as any);
    }
    setLoading(false);
  }, [bateriaId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!bateriaId) return;
    const ch = supabase
      .channel(`bateria-${bateriaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bateria_inscricoes', filter: `bateria_id=eq.${bateriaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bateria_pontuacoes', filter: `bateria_id=eq.${bateriaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneio_baterias', filter: `id=eq.${bateriaId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bateriaId, load]);

  return { bateria, grupo, inscricoes, pontuacoes, loading, reload: load };
}
