import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function ConviteTorneio() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/login?redirect=/torneio/convite/${token}`, { replace: true });
      return;
    }
    if (!token) return;
    setProcessing(true);
    supabase.rpc('aceitar_convite_torneio', { _token: token }).then(({ data, error }) => {
      setProcessing(false);
      if (error) {
        toast.error(error.message);
        navigate('/torneios', { replace: true });
        return;
      }
      const torneioId = (data as any)?.torneio_id;
      toast.success('Convite aceito! Bem-vindo ao torneio.');
      navigate(torneioId ? `/torneios/${torneioId}` : '/torneios', { replace: true });
    });
  }, [user, loading, token, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-premium p-8 text-center max-w-md space-y-4">
        <Trophy className="w-12 h-12 text-secondary mx-auto" />
        <h1 className="heading-serif text-xl font-semibold">Processando convite…</h1>
        {processing && <Loader2 className="w-5 h-5 animate-spin mx-auto text-secondary" />}
      </div>
    </div>
  );
}
