import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Friendship } from '@/types/friend';
import { toast } from 'sonner';

export function useAmigos() {
  const { user } = useAuth();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('friendships')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const otherIds = (rows || []).map(r =>
        r.requester_user_id === user.id ? r.addressee_user_id : r.requester_user_id
      );
      const uniqueIds = [...new Set(otherIds)];

      const [profilesRes, criadoresRes] = await Promise.all([
        uniqueIds.length
          ? supabase.from('profiles').select('user_id, email').in('user_id', uniqueIds)
          : Promise.resolve({ data: [] as any[] }),
        uniqueIds.length
          ? supabase.from('criador_profile').select('user_id, nome_criadouro, codigo_criadouro').in('user_id', uniqueIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const profMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const critMap = new Map((criadoresRes.data || []).map((c: any) => [c.user_id, c]));

      const enriched: Friendship[] = (rows || []).map((r: any) => {
        const isReq = r.requester_user_id === user.id;
        const otherId = isReq ? r.addressee_user_id : r.requester_user_id;
        const prof = profMap.get(otherId) as any;
        const crit = critMap.get(otherId) as any;
        return {
          id: r.id,
          requester_user_id: r.requester_user_id,
          addressee_user_id: r.addressee_user_id,
          status: r.status,
          created_at: r.created_at,
          responded_at: r.responded_at ?? undefined,
          other_user_id: otherId,
          other_email: prof?.email,
          other_nome_criadouro: crit?.nome_criadouro,
          other_codigo_criadouro: crit?.codigo_criadouro,
          is_requester: isReq,
        };
      });
      setFriendships(enriched);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao carregar amigos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`friendships-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const enviarPedido = async (destinatario: string) => {
    const { error } = await supabase.rpc('enviar_pedido_amizade', { _destinatario: destinatario });
    if (error) throw new Error(error.message);
    toast.success('Pedido enviado!');
    load();
  };

  const responderPedido = async (id: string, aceitar: boolean) => {
    const { error } = await supabase.rpc('responder_pedido_amizade', { _friendship_id: id, _aceitar: aceitar });
    if (error) throw new Error(error.message);
    toast.success(aceitar ? 'Amizade aceita!' : 'Pedido rejeitado');
    load();
  };

  const removerAmizade = async (id: string) => {
    const { error } = await supabase.rpc('remover_amizade', { _friendship_id: id });
    if (error) throw new Error(error.message);
    toast.success('Removido');
    load();
  };

  const amigos = friendships.filter(f => f.status === 'Aceito');
  const pedidosRecebidos = friendships.filter(f => f.status === 'Pendente' && !f.is_requester);
  const pedidosEnviados = friendships.filter(f => f.status === 'Pendente' && f.is_requester);

  return { friendships, amigos, pedidosRecebidos, pedidosEnviados, loading, enviarPedido, responderPedido, removerAmizade, reload: load };
}
