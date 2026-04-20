import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type BannerTipo = 'info' | 'warning' | 'success' | 'error';

interface BannerData {
  banner_ativo: boolean;
  banner_mensagem: string | null;
  banner_tipo: BannerTipo;
}

const TIPO_STYLES: Record<BannerTipo, { wrap: string; icon: React.ComponentType<any> }> = {
  info: { wrap: 'bg-secondary/15 text-secondary-foreground border-secondary/30', icon: Info },
  warning: { wrap: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', icon: AlertTriangle },
  success: { wrap: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  error: { wrap: 'bg-destructive/15 text-destructive border-destructive/30', icon: AlertCircle },
};

export default function SystemBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchBanner = async () => {
      const { data } = await (supabase as any)
        .from('system_config')
        .select('banner_ativo, banner_mensagem, banner_tipo')
        .eq('id', true)
        .maybeSingle();
      if (mounted) setBanner(data);
    };
    fetchBanner();

    const channel = supabase
      .channel('system_config_banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, fetchBanner)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!banner?.banner_ativo || !banner.banner_mensagem) return null;

  const style = TIPO_STYLES[banner.banner_tipo] ?? TIPO_STYLES.info;
  const Icon = style.icon;

  return (
    <div className={cn('w-full border-b px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium', style.wrap)}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-center">{banner.banner_mensagem}</span>
    </div>
  );
}
