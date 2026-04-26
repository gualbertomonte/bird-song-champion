import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogRow {
  id: string;
  admin_user_id: string;
  acao: string;
  alvo_user_id: string | null;
  alvo_email: string | null;
  detalhes: any;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

const ACAO_LABEL: Record<string, { label: string; tone: string }> = {
  bloquear: { label: 'Bloqueio', tone: 'bg-destructive/15 text-destructive' },
  desbloquear: { label: 'Desbloqueio', tone: 'bg-success/15 text-success' },
  reset_senha: { label: 'Reset senha', tone: 'bg-warning/15 text-warning' },
  excluir: { label: 'Exclusão', tone: 'bg-destructive/20 text-destructive' },
  export_csv: { label: 'Export CSV', tone: 'bg-secondary/15 text-secondary' },
};

export default function AdminLogs() {
  const [busca, setBusca] = useState('');
  const [acaoFilter, setAcaoFilter] = useState<string>('todas');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as LogRow[];
    },
  });

  // Map de admin -> email para display
  const { data: admins } = useQuery({
    queryKey: ['admin-logs-admins'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, email');
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p.email; });
      return map;
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = busca.trim().toLowerCase();
    return data.filter(l => {
      if (acaoFilter !== 'todas' && l.acao !== acaoFilter) return false;
      if (q) {
        const adminEmail = admins?.[l.admin_user_id] || '';
        const match = adminEmail.toLowerCase().includes(q)
          || (l.alvo_email || '').toLowerCase().includes(q)
          || l.acao.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [data, busca, acaoFilter, admins]);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por admin, alvo ou ação…"
              className="pl-9"
            />
          </div>
          <Select value={acaoFilter} onValueChange={setAcaoFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as ações</SelectItem>
              {Object.entries(ACAO_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {filtered.length} de {data?.length ?? 0} registros (últimos 500)
        </p>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum log registrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => {
                const meta = ACAO_LABEL[l.acao] || { label: l.acao, tone: 'bg-muted text-muted-foreground' };
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(l.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-xs">{admins?.[l.admin_user_id] || l.admin_user_id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge className={`${meta.tone} hover:${meta.tone} border-0 text-[10px]`}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{l.alvo_email || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {l.detalhes && Object.keys(l.detalhes).length > 0 ? JSON.stringify(l.detalhes) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.ip || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
