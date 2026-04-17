import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { TorneioGrupo, GrupoConvite } from '@/types/grupo';

export function useGrupos() {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<TorneioGrupo[]>([]);
  const [convitesPendentes, setConvitesPendentes] = useState<GrupoConvite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Grupos onde sou membro ativo OU admin
    const { data: membros } = await supabase
      .from('torneio_grupo_membros')
      .select('grupo_id')
      .eq('user_id', user.id)
      .eq('status', 'Ativo');
    const ids = (membros || []).map(m => m.grupo_id);
    let gs: TorneioGrupo[] = [];
    if (ids.length > 0) {
      const { data } = await supabase
        .from('torneio_grupos')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      gs = (data || []) as TorneioGrupo[];
    }
    setGrupos(gs);

    const { data: cs } = await supabase
      .from('torneio_grupo_convites')
      .select('*')
      .eq('convidado_user_id', user.id)
      .eq('status', 'Pendente');
    setConvitesPendentes((cs || []) as GrupoConvite[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('grupos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneio_grupo_membros' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneio_grupo_convites' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  return { grupos, convitesPendentes, loading, reload: load };
}
