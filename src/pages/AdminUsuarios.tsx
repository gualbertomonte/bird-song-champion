import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Search, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  nome_criadouro: string | null;
  codigo_criadouro: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  total_aves: number;
}

export default function AdminUsuarios() {
  const [busca, setBusca] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_listar_usuarios');
      if (error) throw error;
      return (data || []) as AdminUser[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = busca.trim().toLowerCase();
    if (!q) return data;
    return data.filter(u =>
      u.email.toLowerCase().includes(q) ||
      (u.nome_criadouro || '').toLowerCase().includes(q) ||
      (u.codigo_criadouro || '').toLowerCase().includes(q)
    );
  }, [data, busca]);

  const fmt = (d: string | null) =>
    d ? format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h1 className="heading-serif text-2xl font-semibold text-foreground">Administração de Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {data?.length ?? 0} usuários cadastrados
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por e-mail, criadouro ou código…"
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">
            Erro ao carregar: {(error as Error).message}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Criadouro</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-center">Aves</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Último login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{u.email}</span>
                      {u.display_name && (
                        <span className="text-xs text-muted-foreground">{u.display_name}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.nome_criadouro || '—'}</TableCell>
                  <TableCell>
                    {u.codigo_criadouro ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">{u.codigo_criadouro}</code>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-secondary">{u.total_aves}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmt(u.created_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmt(u.last_sign_in_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
