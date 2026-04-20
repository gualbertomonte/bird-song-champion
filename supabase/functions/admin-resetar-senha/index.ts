import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Não autenticado' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Não autenticado' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdminData } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdminData) return json({ error: 'Apenas administradores' }, 403);

    const { user_id } = await req.json();
    if (!user_id) return json({ error: 'user_id obrigatório' }, 400);

    const { data: alvo } = await admin.from('profiles').select('email').eq('user_id', user_id).maybeSingle();
    if (!alvo) return json({ error: 'Usuário não encontrado' }, 404);

    const origin = req.headers.get('origin') || 'https://plantelpro.lovable.app';

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: alvo.email,
      options: { redirectTo: `${origin}/reset-password` },
    });
    if (error) return json({ error: error.message }, 500);

    await admin.from('admin_logs').insert({
      admin_user_id: user.id,
      acao: 'reset_senha',
      alvo_user_id: user_id,
      alvo_email: alvo.email,
      ip: req.headers.get('x-forwarded-for') || null,
      user_agent: req.headers.get('user-agent') || null,
    });

    return json({
      success: true,
      action_link: data.properties?.action_link,
      email: alvo.email,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
