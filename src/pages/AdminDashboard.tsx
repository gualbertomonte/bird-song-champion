import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, UserPlus, TrendingUp, TrendingDown, Activity, UserX,
  Bird as BirdIcon, Trophy, Handshake, Mail, Heart, ShieldAlert,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Metricas {
  total_usuarios: number; novos_7d: number; novos_30d: number;
  novos_mes_atual: number; novos_mes_anterior: number; crescimento_mes_pct: number;
  ativos_30d: number; ativos_30d_pct: number;
  inativos_60d: number; inativos_60d_pct: number;
  total_aves: number; media_aves_por_usuario: number;
  usuarios_com_torneio: number; usuarios_com_torneio_pct: number;
  usuarios_com_emprestimo: number; usuarios_com_emprestimo_pct: number;
  convites_enviados: number; convites_aceitos: number; taxa_conversao_convites: number;
  media_amigos_por_usuario: number; bloqueados: number;
}

export default function AdminDashboard() {
  const { data: m, isLoading } = useQuery({
    queryKey: ['admin-metricas'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_dashboard_metricas');
      if (error) throw error;
      return data as unknown as Metricas;
    },
  });

  const { data: serie } = useQuery({
    queryKey: ['admin-serie-novos', 30],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_serie_novos_usuarios', { _dias: 30 });
      if (error) throw error;
      return (data || []) as { dia: string; total: number }[];
    },
  });

  if (isLoading || !m) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const crescimentoPositivo = m.crescimento_mes_pct >= 0;

  return (
    <div className="space-y-6">
      {/* Crescimento */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Crescimento</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi icon={Users} label="Total de usuários" value={m.total_usuarios} tone="primary" />
          <Kpi icon={UserPlus} label="Novos (7d)" value={m.novos_7d} subtitle={`${m.novos_30d} em 30d`} tone="secondary" />
          <Kpi
            icon={crescimentoPositivo ? TrendingUp : TrendingDown}
            label="Crescimento mensal"
            value={`${crescimentoPositivo ? '+' : ''}${m.crescimento_mes_pct}%`}
            subtitle={`${m.novos_mes_atual} vs ${m.novos_mes_anterior}`}
            tone={crescimentoPositivo ? 'success' : 'warning'}
          />
          <Kpi icon={ShieldAlert} label="Bloqueados" value={m.bloqueados} tone="warning" />
        </div>
      </section>

      {/* Atividade */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Atividade</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi icon={Activity} label="Ativos (30d)" value={m.ativos_30d} subtitle={`${m.ativos_30d_pct}% do total`} tone="success" />
          <Kpi icon={UserX} label="Inativos (60d)" value={m.inativos_60d} subtitle={`${m.inativos_60d_pct}% do total`} tone="muted" />
          <Kpi icon={BirdIcon} label="Aves cadastradas" value={m.total_aves} tone="primary" />
          <Kpi icon={BirdIcon} label="Média aves/usuário" value={m.media_aves_por_usuario} tone="primary" />
        </div>
      </section>

      {/* Engajamento */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Engajamento</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi icon={Trophy} label="Em torneios" value={m.usuarios_com_torneio} subtitle={`${m.usuarios_com_torneio_pct}%`} tone="secondary" />
          <Kpi icon={Handshake} label="Empréstimo/transferência" value={m.usuarios_com_emprestimo} subtitle={`${m.usuarios_com_emprestimo_pct}%`} tone="secondary" />
          <Kpi icon={Mail} label="Conversão de convites" value={`${m.taxa_conversao_convites}%`} subtitle={`${m.convites_aceitos} de ${m.convites_enviados}`} tone="success" />
          <Kpi icon={Heart} label="Amigos por usuário" value={m.media_amigos_por_usuario} tone="primary" />
        </div>
      </section>

      {/* Gráfico */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="heading-serif text-lg font-semibold text-foreground">Novos usuários — últimos 30 dias</h3>
          <p className="text-xs text-muted-foreground">Quantidade de cadastros por dia</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serie || []}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(d) => format(parseISO(d), 'dd/MM', { locale: ptBR })}
              />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(d) => format(parseISO(d as string), "dd 'de' MMMM", { locale: ptBR })}
                formatter={(v: number) => [v, 'Novos']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--secondary))"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'hsl(var(--secondary))' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

const tones = {
  primary: 'from-primary/15 to-primary/5 text-primary',
  secondary: 'from-secondary/15 to-secondary/5 text-secondary',
  success: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400',
  warning: 'from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400',
  muted: 'from-muted-foreground/15 to-muted-foreground/5 text-muted-foreground',
} as const;

function Kpi({ icon: Icon, label, value, subtitle, tone = 'primary' }: {
  icon: any; label: string; value: string | number; subtitle?: string;
  tone?: keyof typeof tones;
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
          <p className="text-2xl heading-serif font-semibold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
