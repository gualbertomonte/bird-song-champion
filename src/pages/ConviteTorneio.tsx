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
      // Call the SECURITY DEFINER RPC directly — it handles all validation
      // (including organizer redirect) and bypasses RLS issues.
      const { data, error: rpcErr } = await supabase.rpc('aceitar_convite_torneio', { _token: token });

      if (rpcErr) {
        // If user is already organizer or participant, try to find the tournament
        // via the convite to redirect them anyway.
        const { data: convite } = await supabase
          .from('torneio_convites')
          .select('torneio_id')
          .eq('token', token)
          .maybeSingle();

        if (convite?.torneio_id) {
          // Check if user already has access
          const { data: torneio } = await supabase
            .from('torneios')
            .select('id')
            .eq('id', convite.torneio_id)
            .maybeSingle();
          if (torneio) {
            toast.info('Você já participa deste torneio.');
            navigate(`/torneios/${convite.torneio_id}`, { replace: true });
            return;
          }
        }

        setError(rpcErr.message || 'Convite inválido ou expirado.');
        return;
      }

      const torneioId = (data as any)?.torneio_id;
      if (!torneioId) {
        setError('Resposta inesperada do servidor.');
        return;
      }
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
