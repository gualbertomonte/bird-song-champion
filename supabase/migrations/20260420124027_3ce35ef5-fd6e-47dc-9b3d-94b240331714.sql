-- Bloqueio lógico em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bloqueado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bloqueado_em timestamptz,
  ADD COLUMN IF NOT EXISTS bloqueado_motivo text;

-- admin_logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  acao text NOT NULL,
  alvo_user_id uuid,
  alvo_email text,
  detalhes jsonb DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_alvo ON public.admin_logs (alvo_user_id);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_logs_select ON public.admin_logs;
CREATE POLICY admin_logs_select ON public.admin_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS admin_logs_insert ON public.admin_logs;
CREATE POLICY admin_logs_insert ON public.admin_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_user_id = auth.uid());

-- Drop função antiga (assinatura mudou)
DROP FUNCTION IF EXISTS public.admin_listar_usuarios();

CREATE FUNCTION public.admin_listar_usuarios()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  nome_criadouro text,
  codigo_criadouro text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  total_aves bigint,
  total_torneios bigint,
  total_emprestimos bigint,
  bloqueado boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.display_name,
    cp.nome_criadouro,
    cp.codigo_criadouro,
    p.created_at,
    u.last_sign_in_at,
    COALESCE(b.total, 0) AS total_aves,
    COALESCE(t.total, 0) AS total_torneios,
    COALESCE(l.total, 0) AS total_emprestimos,
    COALESCE(p.bloqueado, false) AS bloqueado
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.criador_profile cp ON cp.user_id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*)::BIGINT AS total
    FROM public.birds
    WHERE loan_status <> 'emprestada_entrada'
    GROUP BY user_id
  ) b ON b.user_id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(DISTINCT torneio_id)::BIGINT AS total
    FROM public.torneio_participantes
    GROUP BY user_id
  ) t ON t.user_id = p.user_id
  LEFT JOIN (
    SELECT owner_user_id AS user_id, COUNT(*)::BIGINT AS total
    FROM public.bird_loans
    GROUP BY owner_user_id
  ) l ON l.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_dashboard_metricas()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_usuarios int;
  _novos_7d int;
  _novos_30d int;
  _novos_mes_atual int;
  _novos_mes_anterior int;
  _crescimento_pct numeric;
  _ativos_30d int;
  _inativos_60d int;
  _total_aves int;
  _media_aves numeric;
  _usuarios_torneio int;
  _usuarios_emprestimo int;
  _convites_enviados int;
  _convites_aceitos int;
  _media_amigos numeric;
  _bloqueados int;
  _amizades_aceitas int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores';
  END IF;

  SELECT COUNT(*) INTO _total_usuarios FROM public.profiles;
  SELECT COUNT(*) INTO _novos_7d FROM public.profiles WHERE created_at > now() - interval '7 days';
  SELECT COUNT(*) INTO _novos_30d FROM public.profiles WHERE created_at > now() - interval '30 days';

  SELECT COUNT(*) INTO _novos_mes_atual FROM public.profiles
  WHERE created_at >= date_trunc('month', now());

  SELECT COUNT(*) INTO _novos_mes_anterior FROM public.profiles
  WHERE created_at >= date_trunc('month', now() - interval '1 month')
    AND created_at < date_trunc('month', now());

  IF _novos_mes_anterior > 0 THEN
    _crescimento_pct := round(((_novos_mes_atual - _novos_mes_anterior)::numeric / _novos_mes_anterior) * 100, 1);
  ELSE
    _crescimento_pct := CASE WHEN _novos_mes_atual > 0 THEN 100 ELSE 0 END;
  END IF;

  SELECT COUNT(*) INTO _ativos_30d FROM auth.users WHERE last_sign_in_at > now() - interval '30 days';
  SELECT COUNT(*) INTO _inativos_60d FROM auth.users WHERE last_sign_in_at IS NULL OR last_sign_in_at < now() - interval '60 days';

  SELECT COUNT(*) INTO _total_aves FROM public.birds WHERE loan_status <> 'emprestada_entrada';
  IF _total_usuarios > 0 THEN
    _media_aves := round(_total_aves::numeric / _total_usuarios, 1);
  ELSE _media_aves := 0; END IF;

  SELECT COUNT(DISTINCT user_id) INTO _usuarios_torneio FROM (
    SELECT user_id FROM public.torneio_participantes
    UNION SELECT user_id FROM public.torneio_grupo_membros WHERE status = 'Ativo'
    UNION SELECT membro_user_id AS user_id FROM public.bateria_inscricoes
  ) sub;

  SELECT COUNT(DISTINCT user_id) INTO _usuarios_emprestimo FROM (
    SELECT owner_user_id AS user_id FROM public.bird_loans
    UNION SELECT borrower_user_id AS user_id FROM public.bird_loans WHERE borrower_user_id IS NOT NULL
    UNION SELECT transferido_por_user_id AS user_id FROM public.pending_transfers WHERE transferido_por_user_id IS NOT NULL
  ) sub;

  SELECT
    (SELECT COUNT(*) FROM public.torneio_convites)
    + (SELECT COUNT(*) FROM public.torneio_grupo_convites)
    + (SELECT COUNT(*) FROM public.torneio_grupo_convites_email)
    + (SELECT COUNT(*) FROM public.friendships)
    + (SELECT COUNT(*) FROM public.bird_loans)
    + (SELECT COUNT(*) FROM public.pending_transfers)
  INTO _convites_enviados;

  SELECT
    (SELECT COUNT(*) FROM public.torneio_convites WHERE status = 'Aceito')
    + (SELECT COUNT(*) FROM public.torneio_grupo_convites WHERE status = 'Aceito')
    + (SELECT COUNT(*) FROM public.torneio_grupo_convites_email WHERE status = 'Aceito')
    + (SELECT COUNT(*) FROM public.friendships WHERE status = 'Aceito')
  INTO _convites_aceitos;

  SELECT COUNT(*) INTO _amizades_aceitas FROM public.friendships WHERE status = 'Aceito';
  IF _total_usuarios > 0 THEN
    _media_amigos := round((_amizades_aceitas * 2.0) / _total_usuarios, 1);
  ELSE _media_amigos := 0; END IF;

  SELECT COUNT(*) INTO _bloqueados FROM public.profiles WHERE bloqueado = true;

  RETURN jsonb_build_object(
    'total_usuarios', _total_usuarios,
    'novos_7d', _novos_7d,
    'novos_30d', _novos_30d,
    'novos_mes_atual', _novos_mes_atual,
    'novos_mes_anterior', _novos_mes_anterior,
    'crescimento_mes_pct', _crescimento_pct,
    'ativos_30d', _ativos_30d,
    'ativos_30d_pct', CASE WHEN _total_usuarios > 0 THEN round((_ativos_30d::numeric / _total_usuarios) * 100, 1) ELSE 0 END,
    'inativos_60d', _inativos_60d,
    'inativos_60d_pct', CASE WHEN _total_usuarios > 0 THEN round((_inativos_60d::numeric / _total_usuarios) * 100, 1) ELSE 0 END,
    'total_aves', _total_aves,
    'media_aves_por_usuario', _media_aves,
    'usuarios_com_torneio', _usuarios_torneio,
    'usuarios_com_torneio_pct', CASE WHEN _total_usuarios > 0 THEN round((_usuarios_torneio::numeric / _total_usuarios) * 100, 1) ELSE 0 END,
    'usuarios_com_emprestimo', _usuarios_emprestimo,
    'usuarios_com_emprestimo_pct', CASE WHEN _total_usuarios > 0 THEN round((_usuarios_emprestimo::numeric / _total_usuarios) * 100, 1) ELSE 0 END,
    'convites_enviados', _convites_enviados,
    'convites_aceitos', _convites_aceitos,
    'taxa_conversao_convites', CASE WHEN _convites_enviados > 0 THEN round((_convites_aceitos::numeric / _convites_enviados) * 100, 1) ELSE 0 END,
    'media_amigos_por_usuario', _media_amigos,
    'bloqueados', _bloqueados
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_serie_novos_usuarios(_dias int DEFAULT 30)
RETURNS TABLE(dia date, total int)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores';
  END IF;

  RETURN QUERY
  SELECT d::date AS dia, COALESCE(COUNT(p.user_id), 0)::int AS total
  FROM generate_series(
    (now() - (_dias || ' days')::interval)::date,
    now()::date,
    '1 day'::interval
  ) d
  LEFT JOIN public.profiles p ON date_trunc('day', p.created_at)::date = d::date
  GROUP BY d
  ORDER BY d;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_user_detalhe(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_aves int; _total_torneios int; _total_grupos int; _total_baterias int;
  _emprestimos_dados int; _emprestimos_recebidos int; _total_amigos int;
  _last_sign_in timestamptz; _email text; _display text; _criadouro text;
  _codigo text; _created timestamptz; _bloqueado boolean;
  _bloqueado_em timestamptz; _bloqueado_motivo text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores';
  END IF;

  SELECT email, display_name, created_at, COALESCE(bloqueado,false), bloqueado_em, bloqueado_motivo
    INTO _email, _display, _created, _bloqueado, _bloqueado_em, _bloqueado_motivo
  FROM public.profiles WHERE user_id = _user_id;

  IF _email IS NULL THEN RAISE EXCEPTION 'Usuário não encontrado'; END IF;

  SELECT nome_criadouro, codigo_criadouro INTO _criadouro, _codigo
  FROM public.criador_profile WHERE user_id = _user_id;

  SELECT last_sign_in_at INTO _last_sign_in FROM auth.users WHERE id = _user_id;

  SELECT COUNT(*) INTO _total_aves FROM public.birds
   WHERE user_id = _user_id AND loan_status <> 'emprestada_entrada';
  SELECT COUNT(DISTINCT torneio_id) INTO _total_torneios
   FROM public.torneio_participantes WHERE user_id = _user_id;
  SELECT COUNT(*) INTO _total_grupos
   FROM public.torneio_grupo_membros WHERE user_id = _user_id AND status = 'Ativo';
  SELECT COUNT(*) INTO _total_baterias
   FROM public.bateria_inscricoes WHERE membro_user_id = _user_id;
  SELECT COUNT(*) INTO _emprestimos_dados
   FROM public.bird_loans WHERE owner_user_id = _user_id;
  SELECT COUNT(*) INTO _emprestimos_recebidos
   FROM public.bird_loans WHERE borrower_user_id = _user_id;
  SELECT COUNT(*) INTO _total_amigos FROM public.friendships
   WHERE status = 'Aceito' AND (requester_user_id = _user_id OR addressee_user_id = _user_id);

  RETURN jsonb_build_object(
    'user_id', _user_id, 'email', _email, 'display_name', _display,
    'nome_criadouro', _criadouro, 'codigo_criadouro', _codigo,
    'created_at', _created, 'last_sign_in_at', _last_sign_in,
    'bloqueado', _bloqueado, 'bloqueado_em', _bloqueado_em, 'bloqueado_motivo', _bloqueado_motivo,
    'total_aves', _total_aves, 'total_torneios', _total_torneios,
    'total_grupos', _total_grupos, 'total_baterias', _total_baterias,
    'emprestimos_dados', _emprestimos_dados, 'emprestimos_recebidos', _emprestimos_recebidos,
    'total_amigos', _total_amigos
  );
END;
$$;