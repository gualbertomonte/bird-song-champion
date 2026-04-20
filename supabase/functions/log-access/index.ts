import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function detectDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  const s = (ua || '').toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(s)) return 'tablet';
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(s)) return 'mobile';
  return 'desktop';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'no auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if (uerr || !user) {
      return new Response(JSON.stringify({ error: 'invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ua = req.headers.get('user-agent') || '';
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      null;

    let event = 'login';
    try {
      const body = await req.json();
      if (body?.event) event = String(body.event);
    } catch { /* no body */ }

    const admin = createClient(supabaseUrl, serviceKey);
    const { error } = await admin.from('access_logs').insert({
      user_id: user.id,
      event,
      device_type: detectDevice(ua),
      user_agent: ua.slice(0, 500),
      ip,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
