import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Users, MoreVertical, Lock, Unlock, KeyRound, Trash2, Eye, Download, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  nome_criadouro: string | null;
  codigo_criadouro: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  total_aves: number;
  total_torneios: number;
  total_emprestimos: number;
  bloqueado: boolean;
}

type StatusFilter = 'todos' | 'ativos' | 'inativos' | 'bloqueados';
type AvesFilter = 'todos' | 'com' | 'sem';

export default function AdminUsuarios() {
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [avesFilter, setAvesFilter] = useState<AvesFilter>('todos');
  const [confirmAction, setConfirmAction] = useState<null | {
    tipo: 'bloquear' | 'desbloquear' | 'reset' | 'excluir';
    user: AdminUser;
    confirmDestrutivo?: boolean;
  }>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { toast } = useToast();
  const qc = useQueryClient();

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
    const seseanaMs = 30 * 24 * 60 * 60 * 1000;
    return data.filter(u => {
      if (q) {
        const match = u.email.toLowerCase().includes(q)
          || (u.nome_criadouro || '').toLowerCase().includes(q)
          || (u.codigo_criadouro || '').toLowerCase().includes(q)
          || (u.display_name || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter === 'bloqueados' && !u.bloqueado) return false;
      if (statusFilter === 'ativos') {
        if (u.bloqueado) return false;
        if (!u.last_sign_in_at || Date.now() - new Date(u.last_sign_in_at).getTime() > seseanaMs) return false;
      }
      if (statusFilter === 'inativos') {
        if (u.bloqueado) return false;
        if (u.last_sign_in_at && Date.now() - new Date(u.last_sign_in_at).getTime() <= seseanaMs) return false;
      }
      if (avesFilter === 'com' && u.total_aves === 0) return false;
      if (avesFilter === 'sem' && u.total_aves > 0) return false;
      return true;
    });
  }, [data, busca, statusFilter, avesFilter]);

  const fmt = (d: string | null) =>
    d ? format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—';

  async function executar() {
    if (!confirmAction) return;
    setBusy(true);
    try {
      const { tipo, user, confirmDestrutivo } = confirmAction;
      if (tipo === 'bloquear' || tipo === 'desbloquear') {
        const { error } = await supabase.functions.invoke('admin-bloquear-usuario', {
          body: { user_id: user.user_id, bloquear: tipo === 'bloquear' },
        });
        if (error) throw error;
        toast({ title: tipo === 'bloquear' ? 'Usuário bloqueado' : 'Usuário desbloqueado' });
      } else if (tipo === 'reset') {
        const { data, error } = await supabase.functions.invoke('admin-resetar-senha', {
          body: { user_id: user.user_id },
        });
        if (error) throw error;
        if ((data as any)?.action_link) {
          setResetLink((data as any).action_link);
        }
        toast({ title: 'Link de redefinição gerado' });
      } else if (tipo === 'excluir') {
        const { data, error } = await supabase.functions.invoke('admin-excluir-usuario', {
          body: { user_id: user.user_id, confirm: !!confirmDestrutivo },
        });
        if (error) {
          if ((data as any)?.requires_confirm) {
            setConfirmAction({ ...confirmAction, confirmDestrutivo: true });
            setBusy(false);
            return;
          }
          throw error;
        }
        toast({ title: 'Usuário excluído' });
      }
      qc.invalidateQueries({ queryKey: ['admin-usuarios'] });
      qc.invalidateQueries({ queryKey: ['admin-metricas'] });
      setConfirmAction(null);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function exportarCSV() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-export-usuarios`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Falha no export');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: 'CSV exportado' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por e-mail, criadouro ou código…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="ativos">Ativos (30d)</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
                <SelectItem value="bloqueados">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={avesFilter} onValueChange={v => setAvesFilter(v as AvesFilter)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas aves</SelectItem>
                <SelectItem value="com">Com aves</SelectItem>
                <SelectItem value="sem">Sem aves</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportarCSV}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {filtered.length} de {data?.length ?? 0} usuários
        </p>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">Erro: {(error as Error).message}</div>
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
                <TableHead className="text-center">Aves</TableHead>
                <TableHead className="text-center">Torneios</TableHead>
                <TableHead className="text-center">Emp.</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Último login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm">{u.email}</span>
                      {u.display_name && <span className="text-xs text-muted-foreground">{u.display_name}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <div className="flex flex-col">
                      <span>{u.nome_criadouro || '—'}</span>
                      {u.codigo_criadouro && (
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded mt-0.5 w-fit">{u.codigo_criadouro}</code>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-secondary">{u.total_aves}</TableCell>
                  <TableCell className="text-center text-sm">{u.total_torneios}</TableCell>
                  <TableCell className="text-center text-sm">{u.total_emprestimos}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(u.created_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(u.last_sign_in_at)}</TableCell>
                  <TableCell>
                    {u.bloqueado ? (
                      <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>
                    ) : u.last_sign_in_at && Date.now() - new Date(u.last_sign_in_at).getTime() < 30 * 86400000 ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-0 text-[10px]">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/usuarios/${u.user_id}`}>
                            <Eye className="w-4 h-4 mr-2" /> Ver detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setConfirmAction({ tipo: 'reset', user: u })}>
                          <KeyRound className="w-4 h-4 mr-2" /> Resetar senha
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.bloqueado ? (
                          <DropdownMenuItem onClick={() => setConfirmAction({ tipo: 'desbloquear', user: u })}>
                            <Unlock className="w-4 h-4 mr-2" /> Desbloquear
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setConfirmAction({ tipo: 'bloquear', user: u })}>
                            <Lock className="w-4 h-4 mr-2" /> Bloquear
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmAction({ tipo: 'excluir', user: u })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Confirmação */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.tipo === 'bloquear' && 'Bloquear usuário?'}
              {confirmAction?.tipo === 'desbloquear' && 'Desbloquear usuário?'}
              {confirmAction?.tipo === 'reset' && 'Gerar link de redefinição?'}
              {confirmAction?.tipo === 'excluir' && (confirmAction.confirmDestrutivo ? 'Confirmar EXCLUSÃO DESTRUTIVA' : 'Excluir usuário?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmAction?.user.email}</strong>
              <br />
              {confirmAction?.tipo === 'bloquear' && 'O usuário será impedido de fazer login.'}
              {confirmAction?.tipo === 'desbloquear' && 'O acesso será restaurado.'}
              {confirmAction?.tipo === 'reset' && 'Um link único será gerado para você compartilhar com o usuário.'}
              {confirmAction?.tipo === 'excluir' && !confirmAction.confirmDestrutivo &&
                'Esta ação é irreversível. Se o usuário tiver aves, você precisará confirmar uma segunda vez.'}
              {confirmAction?.tipo === 'excluir' && confirmAction.confirmDestrutivo && (
                <span className="text-destructive font-semibold">
                  ⚠️ O usuário possui aves cadastradas. Todos os dados (aves, tratamentos, histórico) serão APAGADOS PERMANENTEMENTE.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); executar(); }}
              disabled={busy}
              className={confirmAction?.tipo === 'excluir' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {busy ? 'Processando…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset link modal */}
      <AlertDialog open={!!resetLink} onOpenChange={(o) => !o && setResetLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link de redefinição gerado</AlertDialogTitle>
            <AlertDialogDescription>
              Compartilhe este link com o usuário (válido por tempo limitado):
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted p-3 rounded-lg text-xs break-all font-mono">{resetLink}</div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(resetLink || '');
                toast({ title: 'Link copiado' });
              }}
            >
              <Copy className="w-4 h-4 mr-2" /> Copiar
            </Button>
            <AlertDialogAction onClick={() => setResetLink(null)}>Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
