// Edge function: varre health_records.proxima_dose e cria notificações
// para doses vencendo em <=7 dias ou já vencidas.
// Acionada diariamente via pg_cron.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date();
    const in7 = new Date();
    in7.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().slice(0, 10);
    const in7Str = in7.toISOString().slice(0, 10);

    // Doses pendentes vencendo em até 7 dias OU já vencidas (não aplicadas)
    const { data: pendings, error } = await supabase
      .from('health_records')
      .select('id, user_id, bird_id, tipo, descricao, proxima_dose')
      .lte('proxima_dose', in7Str)
      .is('aplicada_em', null)
      .not('proxima_dose', 'is', null);

    if (error) throw error;
    if (!pendings || pendings.length === 0) {
      return new Response(JSON.stringify({ ok: true, created: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar nomes das aves
    const birdIds = [...new Set(pendings.map((p: any) => p.bird_id))];
    const { data: birdsData } = await supabase
      .from('birds').select('id, nome, codigo_anilha').in('id', birdIds);
    const birdMap = new Map((birdsData || []).map((b: any) => [b.id, b]));

    let created = 0;
    for (const p of pendings as any[]) {
      // Já existe notificação para esta dose?
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', p.user_id)
        .eq('tipo', 'health_due')
        .contains('metadata', { health_id: p.id })
        .limit(1);
      if (existing && existing.length > 0) continue;

      const bird = birdMap.get(p.bird_id);
      const venc = new Date(p.proxima_dose);
      const diffDays = Math.floor((venc.getTime() - today.getTime()) / 86400000);
      const status = diffDays < 0
        ? `vencida há ${Math.abs(diffDays)} dia(s)`
        : diffDays === 0 ? 'vence hoje'
        : `vence em ${diffDays} dia(s)`;

      await supabase.from('notifications').insert({
        user_id: p.user_id,
        tipo: 'health_due',
        titulo: `${p.tipo} ${status}`,
        mensagem: `${bird?.nome || 'Ave'} (${bird?.codigo_anilha || ''}) — ${p.descricao || p.tipo}`,
        link: `/saude`,
        metadata: { health_id: p.id, bird_id: p.bird_id, proxima_dose: p.proxima_dose },
      });
      created++;
    }

    return new Response(JSON.stringify({ ok: true, scanned: pendings.length, created }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('check-health-alerts error', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
