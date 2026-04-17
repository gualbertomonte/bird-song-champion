import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Treatment, TreatmentDose } from '@/types/friend';
import { toast } from 'sonner';

export function useTratamentos() {
  const { user } = useAuth();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [doses, setDoses] = useState<TreatmentDose[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([
        supabase.from('treatments').select('*').order('created_at', { ascending: false }),
        supabase.from('treatment_doses').select('*').order('data_prevista', { ascending: true }),
      ]);
      if (tRes.error) throw tRes.error;
      if (dRes.error) throw dRes.error;
      setTreatments((tRes.data || []) as Treatment[]);
      setDoses((dRes.data || []) as TreatmentDose[]);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao carregar tratamentos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`treatments-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'treatments', filter: `user_id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'treatment_doses', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const criarTratamento = async (params: {
    bird_id: string;
    medicamento: string;
    dosagem?: string;
    via?: string;
    data_inicio: string;
    duracao_dias: number;
    frequencia_diaria: number;
    hora_primeira: string;
    observacoes?: string;
  }) => {
    const { error } = await supabase.rpc('criar_tratamento', {
      _bird_id: params.bird_id,
      _medicamento: params.medicamento,
      _dosagem: params.dosagem || null,
      _via: params.via || null,
      _data_inicio: params.data_inicio,
      _duracao_dias: params.duracao_dias,
      _frequencia_diaria: params.frequencia_diaria,
      _hora_primeira: params.hora_primeira,
      _observacoes: params.observacoes || null,
    });
    if (error) throw new Error(error.message);
    toast.success('Tratamento criado! Doses geradas.');
    load();
  };

  const marcarAplicada = async (dose_id: string, observacoes?: string) => {
    const { error } = await supabase.rpc('marcar_dose_aplicada', {
      _dose_id: dose_id,
      _observacoes: observacoes || null,
    });
    if (error) throw new Error(error.message);
    toast.success('Dose aplicada');
    load();
  };

  const cancelarTratamento = async (id: string) => {
    const { error } = await supabase.from('treatments').update({ status: 'Cancelado' }).eq('id', id);
    if (error) throw new Error(error.message);
    toast.success('Tratamento cancelado');
    load();
  };

  const excluirTratamento = async (id: string) => {
    const { error } = await supabase.from('treatments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    toast.success('Tratamento removido');
    load();
  };

  return { treatments, doses, loading, criarTratamento, marcarAplicada, cancelarTratamento, excluirTratamento, reload: load };
}
