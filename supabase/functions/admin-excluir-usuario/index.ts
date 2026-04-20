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

    const { user_id, confirm } = await req.json();
    if (!user_id) return json({ error: 'user_id obrigatório' }, 400);
    if (user_id === user.id) return json({ error: 'Você não pode excluir a si mesmo' }, 400);

    const { data: alvo } = await admin.from('profiles').select('email').eq('user_id', user_id).maybeSingle();
    if (!alvo) return json({ error: 'Usuário não encontrado' }, 404);

    const { count: totalAves } = await admin
      .from('birds').select('id', { count: 'exact', head: true })
      .eq('user_id', user_id).neq('loan_status', 'emprestada_entrada');

    if ((totalAves ?? 0) > 0 && !confirm) {
      return json({
        requires_confirm: true,
        total_aves: totalAves,
        message: `O usuário possui ${totalAves} aves. Confirme a exclusão destrutiva.`,
      }, 409);
    }

    const { error } = await admin.auth.admin.deleteUser(user_id);
    if (error) return json({ error: error.message }, 500);

    await admin.from('admin_logs').insert({
      admin_user_id: user.id,
      acao: 'excluir',
      alvo_user_id: user_id,
      alvo_email: alvo.email,
      detalhes: { total_aves: totalAves ?? 0 },
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
