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

    const body = await req.json();
    const { user_id, bloquear, motivo } = body;
    if (!user_id || typeof bloquear !== 'boolean') {
      return json({ error: 'Parâmetros inválidos' }, 400);
    }

    const { data: alvo } = await admin.from('profiles').select('email').eq('user_id', user_id).maybeSingle();
    if (!alvo) return json({ error: 'Usuário não encontrado' }, 404);

    // Atualiza flag em profiles
    await admin.from('profiles').update({
      bloqueado: bloquear,
      bloqueado_em: bloquear ? new Date().toISOString() : null,
      bloqueado_motivo: bloquear ? (motivo || null) : null,
    }).eq('user_id', user_id);

    // Ban via Supabase Auth Admin
    await admin.auth.admin.updateUserById(user_id, {
      ban_duration: bloquear ? '876000h' : 'none',
    } as any);

    // Log
    await admin.from('admin_logs').insert({
      admin_user_id: user.id,
      acao: bloquear ? 'bloquear' : 'desbloquear',
      alvo_user_id: user_id,
      alvo_email: alvo.email,
      detalhes: { motivo: motivo || null },
      ip: req.headers.get('x-forwarded-for') || null,
      user_agent: req.headers.get('user-agent') || null,
    });

    return json({ success: true });
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
