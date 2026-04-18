import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Crown, LogIn, UserPlus, Bird } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface GrupoPublico {
  id: string;
  nome: string;
  descricao: string | null;
  admin_nome: string;
  total_membros: number;
}

export default function EntrarGrupo() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [grupo, setGrupo] = useState<GrupoPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc('get_grupo_convite_publico', { _token: token });
      if (error || !data) {
        setErro('Convite inválido ou expirado');
      } else {
        setGrupo(data as unknown as GrupoPublico);
      }
      setLoading(false);
    })();
  }, [token]);

  const entrar = async () => {
    if (!token) return;
    setEntrando(true);
    try {
      const { data, error } = await supabase.rpc('aceitar_convite_grupo_por_token', { _token: token });
      if (error) throw error;
      const res = data as any;
      toast.success(res?.ja_membro ? 'Você já é membro deste grupo' : 'Bem-vindo ao grupo!');
      navigate(`/grupos/${res.grupo_id}`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao entrar no grupo');
    } finally {
      setEntrando(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Bird className="w-10 h-10 mx-auto text-secondary animate-pulse" />
          <p className="text-sm text-muted-foreground">Carregando convite…</p>
        </div>
      </div>
    );
  }

  if (erro || !grupo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 p-6 rounded-2xl bg-card border border-border">
          <p className="text-lg font-semibold">Convite inválido</p>
          <p className="text-sm text-muted-foreground">{erro || 'Grupo não encontrado'}</p>
          <Link to="/" className="btn-primary inline-flex">Ir para o início</Link>
        </div>
      </div>
    );
  }

  const redirectPath = `/entrar/grupo/${token}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 p-6 rounded-2xl bg-card border border-border">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Convite para grupo</p>
          <h1 className="heading-serif text-2xl font-semibold">{grupo.nome}</h1>
          {grupo.descricao && <p className="text-sm text-muted-foreground">{grupo.descricao}</p>}
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Crown className="w-3 h-3" /> {grupo.admin_nome}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {grupo.total_membros} membro(s)</span>
        </div>

        {user ? (
          <button
            onClick={entrar}
            disabled={entrando}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {entrando ? 'Entrando…' : 'Entrar no grupo'}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Crie sua conta gratuita ou entre para participar.
            </p>
            <Link
              to={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Criar conta grátis
            </Link>
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border hover:border-secondary/40 text-sm font-medium"
            >
              <LogIn className="w-4 h-4" /> Já tenho conta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
