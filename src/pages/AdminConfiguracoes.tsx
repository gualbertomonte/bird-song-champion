import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Megaphone, FileCheck2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

type BannerTipo = 'info' | 'warning' | 'success' | 'error';

const ADS_TXT_ESPERADO = 'google.com, pub-2835871674648959, DIRECT, f08c47fec0942fa0';
const ADS_TXT_DOMINIOS = [
  'https://meuplantelpro.com.br/ads.txt',
  'https://www.meuplantelpro.com.br/ads.txt',
];

type AdsCheckStatus = 'ok' | 'mismatch' | 'unreachable';
type AdsCheckResult = { url: string; status: AdsCheckStatus; conteudo?: string; erro?: string };

export default function AdminConfiguracoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState<BannerTipo>('info');
  const [adsChecking, setAdsChecking] = useState(false);
  const [adsResults, setAdsResults] = useState<AdsCheckResult[] | null>(null);

  const verificarAdsTxt = async () => {
    setAdsChecking(true);
    setAdsResults(null);
    const results: AdsCheckResult[] = await Promise.all(
      ADS_TXT_DOMINIOS.map(async (url) => {
        try {
          const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
          if (!res.ok) {
            return { url, status: 'unreachable' as const, erro: `HTTP ${res.status}` };
          }
          const txt = (await res.text()).trim();
          const linhas = txt.split('\n').map((l) => l.trim());
          const ok = linhas.some((l) => l === ADS_TXT_ESPERADO);
          return { url, status: ok ? 'ok' as const : 'mismatch' as const, conteudo: txt };
        } catch (e: any) {
          return { url, status: 'unreachable' as const, erro: e?.message ?? 'Erro de rede' };
        }
      })
    );
    setAdsResults(results);
    setAdsChecking(false);
    const algumOk = results.some((r) => r.status === 'ok');
    if (algumOk) toast.success('ads.txt válido em pelo menos 1 domínio');
    else toast.error('Nenhum domínio retornou ads.txt válido');
  };

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('system_config')
        .select('banner_ativo, banner_mensagem, banner_tipo')
        .eq('id', true)
        .maybeSingle();
      if (data) {
        setAtivo(!!data.banner_ativo);
        setMensagem(data.banner_mensagem ?? '');
        setTipo((data.banner_tipo as BannerTipo) ?? 'info');
      }
      setLoading(false);
    })();
  }, []);

  const salvar = async () => {
    if (ativo && !mensagem.trim()) {
      toast.error('Defina uma mensagem antes de ativar o banner');
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).rpc('admin_atualizar_banner', {
      _ativo: ativo,
      _mensagem: mensagem.trim() || null,
      _tipo: tipo,
    });
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Banner atualizado');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-secondary" /> Banner global de aviso
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Mensagem fixa exibida no topo da aplicação para todos os usuários enquanto ativa.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label className="text-base">Banner ativo</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Quando ativo, aparece para 100% dos usuários no topo do app.
              </p>
            </div>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as BannerTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informação</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Ex: Manutenção programada amanhã às 22h"
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">{mensagem.length}/300</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={salvar} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
