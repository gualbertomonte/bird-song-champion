import { useEffect, useState, useMemo } from 'react';
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

interface Grupo {
  membro_user_id: string;
  nome_criador: string;
  codigo_criadouro: string | null;
  email: string | null;
  todasConvidadas: boolean;
  aves: Participante[];
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

  const grupos = useMemo<Grupo[]>(() => {
    const map = new Map<string, Grupo>();
    for (const p of lista) {
      const g = map.get(p.membro_user_id);
      if (g) {
        g.aves.push(p);
        if (!p.convidado_pelo_admin) g.todasConvidadas = false;
      } else {
        map.set(p.membro_user_id, {
          membro_user_id: p.membro_user_id,
          nome_criador: p.nome_criador,
          codigo_criadouro: p.codigo_criadouro,
          email: p.email,
          todasConvidadas: p.convidado_pelo_admin,
          aves: [p],
        });
      }
    }
    return Array.from(map.values());
  }, [lista]);

  if (loading) return <p className="text-xs text-muted-foreground py-2">Carregando participantes…</p>;
  if (grupos.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        <Users className="w-6 h-6 mx-auto mb-2 opacity-40" />
        Nenhum participante ainda
      </div>
    );
  }

  const statusBadgeClass = (status: string) =>
    status === 'Aprovada' ? 'bg-secondary/20 text-secondary' :
    status === 'Rejeitada' ? 'bg-destructive/10 text-destructive' :
    status === 'PendenteAve' ? 'bg-primary/15 text-primary' :
    'bg-muted text-muted-foreground';

  return (
    <div className="space-y-2">
      {grupos.map(g => {
        const inicial = (g.nome_criador || '?').charAt(0).toUpperCase();
        return (
          <div key={g.membro_user_id} className="p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center text-sm font-semibold text-secondary uppercase flex-shrink-0">
                {inicial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{g.nome_criador}</p>
                  {g.codigo_criadouro && (
                    <span className="text-[10px] font-mono text-muted-foreground">#{g.codigo_criadouro}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">· {g.aves.length} {g.aves.length === 1 ? 'ave' : 'aves'}</span>
                </div>
                {g.email && <p className="text-[11px] text-muted-foreground truncate">{g.email}</p>}
              </div>
              {g.todasConvidadas && (
                <span className="text-[9px] text-primary flex items-center gap-0.5 flex-shrink-0">
                  <UserCheck className="w-2.5 h-2.5" /> convidado
                </span>
              )}
            </div>

            <div className="mt-2 pl-2 sm:pl-13 space-y-1.5 border-l-2 border-border ml-5">
              {g.aves.map(p => (
                <div key={p.inscricao_id} className="pl-3 py-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">
                      {p.bird_nome ? (
                        <>🐦 <span className="font-medium">{p.bird_nome}</span> {p.codigo_anilha && <span className="font-mono text-muted-foreground">· {p.codigo_anilha}</span>}</>
                      ) : (
                        <span className="italic text-muted-foreground">Aguardando ave</span>
                      )}
                      {p.estacao && <span className="ml-2 text-secondary font-semibold">Estaca {p.estacao}</span>}
                    </p>
                    {isElim && p.status === 'Aprovada' && (
                      <div className="flex gap-3 mt-0.5 text-[10px]">
                        <span className="text-muted-foreground">F1: <b className="text-foreground">{p.pontos_classif ?? '—'}</b></span>
                        <span className="text-muted-foreground">F2: <b className="text-foreground">{p.pontos_final ?? '—'}</b></span>
                        <span className="text-muted-foreground">Total: <b className="text-foreground">{Number(p.pontos_total).toFixed(1)}</b></span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(p.status)}`}>
                      {p.status === 'PendenteAve' ? 'Aguarda ave' : p.status}
                    </span>
                    {isElim && faseAtual !== 'classificatoria' && p.status === 'Aprovada' && (
                      p.classificado_final
                        ? <span className="text-[9px] text-secondary flex items-center gap-0.5"><Trophy className="w-2.5 h-2.5" /> classificada</span>
                        : <span className="text-[9px] text-destructive flex items-center gap-0.5"><XCircle className="w-2.5 h-2.5" /> eliminada</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
