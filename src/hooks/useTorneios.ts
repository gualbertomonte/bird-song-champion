import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Torneio, TorneioConvite, TorneioInscricao, TorneioPontuacao, TorneioAuditLog } from '@/types/torneio';

export function useTorneiosList() {
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('torneios').select('*').order('data', { ascending: false });
    setTorneios((data ?? []) as Torneio[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { torneios, loading, refresh };
}

export function useTorneioDetalhe(torneioId: string | undefined) {
  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [inscricoes, setInscricoes] = useState<TorneioInscricao[]>([]);
  const [pontuacoes, setPontuacoes] = useState<TorneioPontuacao[]>([]);
  const [convites, setConvites] = useState<TorneioConvite[]>([]);
  const [auditLog, setAuditLog] = useState<TorneioAuditLog[]>([]);
  const [participantes, setParticipantes] = useState<{ user_id: string }[]>([]);
  const [criadores, setCriadores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!torneioId) return;
    const [t, ins, pts, conv, audit, parts] = await Promise.all([
      supabase.from('torneios').select('*').eq('id', torneioId).maybeSingle(),
      supabase.from('torneio_inscricoes').select('*').eq('torneio_id', torneioId),
      supabase.from('torneio_pontuacoes').select('*').eq('torneio_id', torneioId),
      supabase.from('torneio_convites').select('*').eq('torneio_id', torneioId),
      supabase.from('torneio_audit_log').select('*').eq('torneio_id', torneioId).order('created_at', { ascending: false }),
      supabase.from('torneio_participantes').select('user_id').eq('torneio_id', torneioId),
    ]);
    setTorneio(t.data as Torneio | null);
    const inscricoesList = (ins.data ?? []) as TorneioInscricao[];
    setInscricoes(inscricoesList);
    setPontuacoes((pts.data ?? []) as TorneioPontuacao[]);
    setConvites((conv.data ?? []) as TorneioConvite[]);
    setAuditLog((audit.data ?? []) as TorneioAuditLog[]);
    setParticipantes((parts.data ?? []) as { user_id: string }[]);

    // Fetch criador names for all involved users (organizer + participants + inscricoes)
    const userIds = new Set<string>();
    if (t.data?.organizer_user_id) userIds.add(t.data.organizer_user_id);
    (parts.data ?? []).forEach((p: any) => userIds.add(p.user_id));
    inscricoesList.forEach(i => userIds.add(i.participante_user_id));
    if (userIds.size > 0) {
      const { data: cps } = await supabase
        .from('criador_profile')
        .select('user_id, nome_criadouro')
        .in('user_id', Array.from(userIds));
      const map: Record<string, string> = {};
      (cps ?? []).forEach((c: any) => { map[c.user_id] = c.nome_criadouro || ''; });
      setCriadores(map);
    }
    setLoading(false);
  }, [torneioId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime
  useEffect(() => {
    if (!torneioId) return;
    const channel = supabase
      .channel(`torneio-${torneioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneio_pontuacoes', filter: `torneio_id=eq.${torneioId}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneio_inscricoes', filter: `torneio_id=eq.${torneioId}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torneios', filter: `id=eq.${torneioId}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [torneioId, refresh]);

  return { torneio, inscricoes, pontuacoes, convites, auditLog, participantes, loading, refresh };
}
