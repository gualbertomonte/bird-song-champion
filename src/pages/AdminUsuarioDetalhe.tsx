import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Bird as BirdIcon, Trophy, Users2, Egg,
  Handshake, Heart, Calendar, Clock, ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Detalhe {
  user_id: string; email: string; display_name: string | null;
  nome_criadouro: string | null; codigo_criadouro: string | null;
  created_at: string; last_sign_in_at: string | null;
  bloqueado: boolean; bloqueado_em: string | null; bloqueado_motivo: string | null;
  total_aves: number; total_torneios: number; total_grupos: number;
  total_baterias: number; emprestimos_dados: number; emprestimos_recebidos: number;
  total_amigos: number;
}

export default function AdminUsuarioDetalhe() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-user-detalhe', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_user_detalhe', { _user_id: id! });
      if (error) throw error;
      return data as unknown as Detalhe;
    },
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  }
  if (error || !data) {
    return <div className="p-8 text-center text-destructive">{(error as Error)?.message || 'Não encontrado'}</div>;
  }

  const fmt = (d: string | null) =>
    d ? format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—';

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/usuarios"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Link>
        </Button>
      </div>

      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="heading-serif text-xl font-semibold text-foreground">{data.email}</h2>
            {data.display_name && <p className="text-sm text-muted-foreground">{data.display_name}</p>}
            {data.nome_criadouro && (
              <p className="text-sm mt-2">
                <span className="text-muted-foreground">Criadouro:</span>{' '}
                <strong>{data.nome_criadouro}</strong>
                {data.codigo_criadouro && (
                  <code className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">{data.codigo_criadouro}</code>
                )}
              </p>
            )}
          </div>
          {data.bloqueado && (
            <Badge variant="destructive" className="gap-1">
              <ShieldAlert className="w-3 h-3" /> Bloqueado
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
          <InfoRow icon={Calendar} label="Cadastrado em" value={fmt(data.created_at)} />
          <InfoRow icon={Clock} label="Último login" value={fmt(data.last_sign_in_at)} />
          {data.bloqueado && (
            <>
              <InfoRow icon={ShieldAlert} label="Bloqueado em" value={fmt(data.bloqueado_em)} />
              <InfoRow icon={ShieldAlert} label="Motivo" value={data.bloqueado_motivo || '—'} />
            </>
          )}
        </div>
      </Card>

      {/* Aviso privacidade */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <p className="text-xs text-muted-foreground">
          🔒 Apenas contagens agregadas são exibidas. Dados sensíveis do plantel (aves individuais, anilhas, saúde, pedigree) <strong>não são acessíveis</strong> ao administrador.
        </p>
      </Card>

      {/* Métricas */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Atividade no app</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard icon={BirdIcon} label="Aves cadastradas" value={data.total_aves} />
          <MetricCard icon={Trophy} label="Torneios" value={data.total_torneios} />
          <MetricCard icon={Users2} label="Grupos ativos" value={data.total_grupos} />
          <MetricCard icon={Egg} label="Eventos/baterias" value={data.total_baterias} />
          <MetricCard icon={Handshake} label="Empréstimos dados" value={data.emprestimos_dados} />
          <MetricCard icon={Handshake} label="Empréstimos recebidos" value={data.emprestimos_recebidos} />
          <MetricCard icon={Heart} label="Amigos" value={data.total_amigos} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
          <p className="text-2xl heading-serif font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}
