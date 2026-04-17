import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trophy, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function ConviteTorneio() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/login?redirect=/torneio/convite/${token}`, { replace: true });
      return;
    }
    if (!token || ranRef.current) return;
    ranRef.current = true;

    (async () => {
      // 1. Look up the invite to find the tournament
      const { data: convite, error: convErr } = await supabase
        .from('torneio_convites')
        .select('torneio_id, tipo, email_convidado, status')
        .eq('token', token)
        .maybeSingle();

      if (convErr || !convite) {
        setError('Convite inválido ou expirado.');
        return;
      }

      // 2. If user is already organizer, just go to the tournament
      const { data: torneio } = await supabase
        .from('torneios')
        .select('organizer_user_id')
        .eq('id', convite.torneio_id)
        .maybeSingle();

      if (torneio?.organizer_user_id === user.id) {
        toast.info('Você é o organizador deste torneio.');
        navigate(`/torneios/${convite.torneio_id}`, { replace: true });
        return;
      }

      // 3. Try to accept the invite
      const { data, error: rpcErr } = await supabase.rpc('aceitar_convite_torneio', { _token: token });
      if (rpcErr) {
        setError(rpcErr.message);
        return;
      }
      const torneioId = (data as any)?.torneio_id ?? convite.torneio_id;
      toast.success('Convite aceito! Bem-vindo ao torneio.');
      navigate(`/torneios/${torneioId}`, { replace: true });
    })();
  }, [user, loading, token, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-premium p-8 text-center max-w-md space-y-4">
        {error ? (
          <>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="heading-serif text-xl font-semibold">Não foi possível aceitar</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={() => navigate('/torneios')} className="btn-primary text-sm">Ir para Torneios</button>
          </>
        ) : (
          <>
            <Trophy className="w-12 h-12 text-secondary mx-auto" />
            <h1 className="heading-serif text-xl font-semibold">Processando convite…</h1>
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-secondary" />
          </>
        )}
      </div>
    </div>
  );
}
