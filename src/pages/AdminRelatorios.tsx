import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Relatorio {
  id: string;
  periodo_inicio: string;
  periodo_fim: string;
  gerado_em: string;
  metricas: any;
  csv_conteudo: string | null;
}

export default function AdminRelatorios() {
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);

  const carregar = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('weekly_reports')
      .select('*')
      .order('periodo_inicio', { ascending: false })
      .limit(52);
    if (error) toast.error('Erro: ' + error.message);
    setRelatorios(data ?? []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const gerarAgora = async () => {
    setGerando(true);
    const { error } = await (supabase as any).rpc('admin_gerar_relatorio_semanal');
    setGerando(false);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Relatório gerado'); carregar(); }
  };

  const baixar = (r: Relatorio) => {
    if (!r.csv_conteudo) return;
    const blob = new Blob([r.csv_conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${r.periodo_inicio}_a_${r.periodo_fim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" /> Relatórios semanais
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gerados automaticamente toda segunda-feira (semana anterior). Você pode forçar a geração manual.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
            <Button size="sm" onClick={gerarAgora} disabled={gerando}>
              {gerando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Gerar agora
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
          ) : relatorios.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Nenhum relatório ainda. Clique em "Gerar agora" para criar o primeiro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Gerado em</TableHead>
                    <TableHead className="text-right">Novos usuários</TableHead>
                    <TableHead className="text-right">Ativos</TableHead>
                    <TableHead className="text-right">Acessos</TableHead>
                    <TableHead className="text-right">Baterias</TableHead>
                    <TableHead className="text-right">CSV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorios.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {format(new Date(r.periodo_inicio + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                        {' – '}
                        {format(new Date(r.periodo_fim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(r.gerado_em), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">{r.metricas?.novos_usuarios ?? 0}</TableCell>
                      <TableCell className="text-right">{r.metricas?.usuarios_ativos ?? 0}</TableCell>
                      <TableCell className="text-right">{r.metricas?.total_acessos ?? 0}</TableCell>
                      <TableCell className="text-right">{r.metricas?.baterias_criadas ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => baixar(r)} disabled={!r.csv_conteudo}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
