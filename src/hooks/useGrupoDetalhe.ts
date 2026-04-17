import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TorneioGrupo, GrupoMembro, Bateria, GrupoConvite, RankingAcumuladoItem } from '@/types/grupo';

export function useGrupoDetalhe(grupoId: string | undefined) {
  const [grupo, setGrupo] = useState<TorneioGrupo | null>(null);
  const [membros, setMembros] = useState<GrupoMembro[]>([]);
  const [convites, setConvites] = useState<GrupoConvite[]>([]);
  const [baterias, setBaterias] = useState<Bateria[]>([]);
  const [ranking, setRanking] = useState<RankingAcumuladoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!grupoId) return;
    setLoading(true);
    const [g, m, c, b, r] = await Promise.all([
      supabase.from('torneio_grupos').select('*').eq('id', grupoId).maybeSingle(),
      supabase.from('torneio_grupo_membros').select('*').eq('grupo_id', grupoId).order('created_at'),
      supabase.from('torneio_grupo_convites').select('*').eq('grupo_id', grupoId).eq('status', 'Pendente'),
      supabase.from('torneio_baterias').select('*').eq('grupo_id', grupoId).order('data', { ascending: false }),
      supabase.rpc('get_ranking_acumulado_grupo', { _grupo_id: grupoId }),
    ]);
    setGrupo(g.data as any);
    setMembros((m.data || []) as any);
    setConvites((c.data || []) as any);
    setBaterias((b.data || []) as any);
    setRanking((r.data || []) as any);
    setLoading(false);
  }, [grupoId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!grupoId) return;
    const ch = supabase
      .channel(`grupo-${grupoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneio_grupo_membros', filter: `grupo_id=eq.${grupoId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneio_baterias', filter: `grupo_id=eq.${grupoId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneio_grupo_convites', filter: `grupo_id=eq.${grupoId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [grupoId, load]);

  return { grupo, membros, convites, baterias, ranking, loading, reload: load };
}
