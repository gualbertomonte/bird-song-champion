import { useEffect, useState } from 'react';
import { Users, UserCheck, Trophy, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Participante {
  inscricao_id: string;
  membro_user_id: string;
  nome_criador: string;
  codigo_criadouro: string | null;
  email: string | null;
  bird_id: string;
  bird_nome: string | null;
  codigo_anilha: string | null;
  estacao: number | null;
  status: string;
  convidado_pelo_admin: boolean;
  classificado_final: boolean;
  pontos_classif: number | null;
  pontos_final: number | null;
  pontos_total: number;
}

interface Props {
  bateriaId: string;
  isElim: boolean;
  faseAtual: string;
}

export function ParticipantesEvento({ bateriaId, isElim, faseAtual }: Props) {
  const [lista, setLista] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase.rpc('get_participantes_evento' as any, { _bateria_id: bateriaId });
    if (!error) setLista((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`participantes-${bateriaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bateria_inscricoes', filter: `bateria_id=eq.${bateriaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bateria_pontuacoes', filter: `bateria_id=eq.${bateriaId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bateriaId]);

  if (loading) return <p className="text-xs text-muted-foreground py-2">Carregando participantes…</p>;
  if (lista.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        <Users className="w-6 h-6 mx-auto mb-2 opacity-40" />
        Nenhum participante ainda
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lista.map(p => {
        const inicial = (p.nome_criador || '?').charAt(0).toUpperCase();
        return (
          <div key={p.inscricao_id} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-sm font-semibold text-secondary uppercase flex-shrink-0">
              {inicial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm truncate">{p.nome_criador}</p>
                {p.codigo_criadouro && (
                  <span className="text-[10px] font-mono text-muted-foreground">#{p.codigo_criadouro}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {p.bird_nome ? (
                  <>🐦 {p.bird_nome} {p.codigo_anilha && <span className="font-mono">· {p.codigo_anilha}</span>}</>
                ) : (
                  <span className="italic">Aguardando ave</span>
                )}
                {p.estacao && <span className="ml-2 text-secondary font-semibold">Estaca {p.estacao}</span>}
              </p>
              {isElim && p.status === 'Aprovada' && (
                <div className="flex gap-3 mt-1 text-[10px]">
                  <span className="text-muted-foreground">F1: <b className="text-foreground">{p.pontos_classif ?? '—'}</b></span>
                  <span className="text-muted-foreground">F2: <b className="text-foreground">{p.pontos_final ?? '—'}</b></span>
                  <span className="text-muted-foreground">Total: <b className="text-foreground">{Number(p.pontos_total).toFixed(1)}</b></span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                p.status === 'Aprovada' ? 'bg-secondary/20 text-secondary' :
                p.status === 'Rejeitada' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>{p.status}</span>
              {p.convidado_pelo_admin && (
                <span className="text-[9px] text-primary flex items-center gap-0.5">
                  <UserCheck className="w-2.5 h-2.5" /> convidado
                </span>
              )}
              {isElim && faseAtual !== 'classificatoria' && p.status === 'Aprovada' && (
                p.classificado_final
                  ? <span className="text-[9px] text-secondary flex items-center gap-0.5"><Trophy className="w-2.5 h-2.5" /> classificada</span>
                  : <span className="text-[9px] text-destructive flex items-center gap-0.5"><XCircle className="w-2.5 h-2.5" /> eliminada</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
