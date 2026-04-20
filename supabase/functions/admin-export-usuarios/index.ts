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
    if (!authHeader) return new Response('Não autenticado', { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response('Não autenticado', { status: 401, headers: corsHeaders });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdminData } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdminData) return new Response('Apenas administradores', { status: 403, headers: corsHeaders });

    const { data, error } = await admin.rpc('admin_listar_usuarios');
    if (error) return new Response(error.message, { status: 500, headers: corsHeaders });

    const headers = ['user_id', 'email', 'display_name', 'nome_criadouro', 'codigo_criadouro',
      'created_at', 'last_sign_in_at', 'total_aves', 'total_torneios', 'total_emprestimos', 'bloqueado'];
    const rows = (data || []).map((u: any) =>
      headers.map(h => {
        const v = u[h];
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    await admin.from('admin_logs').insert({
      admin_user_id: user.id,
      acao: 'export_csv',
      detalhes: { total_linhas: rows.length },
      ip: req.headers.get('x-forwarded-for') || null,
      user_agent: req.headers.get('user-agent') || null,
    });

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="usuarios-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    return new Response((e as Error).message, { status: 500, headers: corsHeaders });
  }
});
