import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Crown, Inbox, Check, X } from 'lucide-react';
import { useGrupos } from '@/hooks/useGrupos';
import { useAuth } from '@/context/AuthContext';
import GrupoCard from '@/components/grupos/GrupoCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Grupos() {
  const { grupos, convitesPendentes, loading, reload } = useGrupos();
  const navigate = useNavigate();

  const responder = async (id: string, aceitar: boolean) => {
    try {
      const { error } = await supabase.rpc('responder_convite_grupo', { _convite_id: id, _aceitar: aceitar });
      if (error) throw error;
      toast.success(aceitar ? 'Convite aceito!' : 'Convite recusado');
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="heading-serif text-2xl md:text-3xl font-semibold">Grupos de Torneio</h1>
          <p className="text-sm text-muted-foreground mt-1">Comunidades fixas com baterias e ranking acumulado</p>
        </div>
        <button onClick={() => navigate('/grupos/novo')} className="btn-primary flex items-center gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Criar grupo</span>
        </button>
      </header>

      {convitesPendentes.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Inbox className="w-4 h-4" /> Convites pendentes ({convitesPendentes.length})
          </h2>
          {convitesPendentes.map(c => (
            <ConviteCard key={c.id} grupoId={c.grupo_id} conviteId={c.id} onResponder={responder} />
          ))}
        </section>
      )}

      <section>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Carregando…</p>
        ) : grupos.length === 0 ? (
          <div className="p-8 rounded-2xl bg-muted/30 border border-border text-center">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Você ainda não participa de nenhum grupo</p>
            <button onClick={() => navigate('/grupos/novo')} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Criar meu primeiro grupo
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grupos.map(g => <GrupoCard key={g.id} grupo={g} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function ConviteCard({ grupoId, conviteId, onResponder }: { grupoId: string; conviteId: string; onResponder: (id: string, a: boolean) => void }) {
  const [nome, setNome] = useState<string>('Carregando…');
  useState(() => {
    supabase.from('torneio_grupos').select('nome').eq('id', grupoId).maybeSingle().then(({ data }: any) => {
      if (data) setNome(data.nome);
    });
  });
  return (
    <div className="p-3 rounded-xl bg-card border border-secondary/30 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{nome}</p>
        <p className="text-[11px] text-muted-foreground">Você foi convidado para este grupo</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onResponder(conviteId, true)} className="p-2 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => onResponder(conviteId, false)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
