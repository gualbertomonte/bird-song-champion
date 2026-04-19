import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { Tournament, Nest } from '@/types/bird';

interface Props {
  tournaments: Tournament[];
  nests: Nest[];
}

export default function AtividadeChart({ tournaments, nests }: Props) {
  // Build last 30 days buckets
  const days: { date: string; label: string; torneios: number; eclosoes: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      date: iso,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      torneios: 0,
      eclosoes: 0,
    });
  }

  const byDate = new Map(days.map(d => [d.date, d]));

  tournaments.forEach(t => {
    const key = t.data?.slice(0, 10);
    const bucket = byDate.get(key);
    if (bucket) bucket.torneios += 1;
  });

  nests.forEach(n => {
    if (!n.data_eclosao) return;
    const key = n.data_eclosao.slice(0, 10);
    const bucket = byDate.get(key);
    if (bucket) bucket.eclosoes += 1;
  });

  const hasData = days.some(d => d.torneios > 0 || d.eclosoes > 0);

  if (!hasData) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        Sem atividade registrada nos últimos 30 dias.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          stroke="hsl(var(--border))"
          interval={4}
        />
        <YAxis
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          stroke="hsl(var(--border))"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line
          type="monotone"
          dataKey="torneios"
          name="Torneios"
          stroke="hsl(var(--secondary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="eclosoes"
          name="Eclosões"
          stroke="hsl(200, 80%, 55%)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
