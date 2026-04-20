-- ============================================================
-- FIX: admin_listar_usuarios - resolver "column user_id is ambiguous"
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_listar_usuarios()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  nome_criadouro text,
  codigo_criadouro text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_aves bigint,
  total_torneios bigint,
  total_emprestimos bigint,
  bloqueado boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.display_name,
    cp.nome_criadouro,
    cp.codigo_criadouro,
    p.created_at,
    au.last_sign_in_at,
    COALESCE((SELECT COUNT(*) FROM public.birds b WHERE b.user_id = p.user_id), 0)::bigint AS total_aves,
    COALESCE((
      SELECT COUNT(DISTINCT t.id)
      FROM public.torneio_participantes t
      WHERE t.user_id = p.user_id
    ), 0)::bigint AS total_torneios,
    COALESCE((
      SELECT COUNT(*) FROM public.bird_loans bl
      WHERE bl.owner_user_id = p.user_id OR bl.borrower_user_id = p.user_id
    ), 0)::bigint AS total_emprestimos,
    p.bloqueado
  FROM public.profiles p
  LEFT JOIN public.criador_profile cp ON cp.user_id = p.user_id
  LEFT JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- ============================================================
-- FASE 2: TELEMETRIA DE ACESSO
-- ============================================================
CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event text NOT NULL DEFAULT 'login',  -- 'login' | 'session_start'
  device_type text,                      -- 'mobile' | 'tablet' | 'desktop'
  user_agent text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_logs_user_created ON public.access_logs(user_id, created_at DESC);
CREATE INDEX idx_access_logs_created ON public.access_logs(created_at DESC);
CREATE INDEX idx_access_logs_device ON public.access_logs(device_type) WHERE device_type IS NOT NULL;

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_logs_admin_select ON public.access_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Inserts feitos exclusivamente via edge function (service-role), então sem policy de insert para clientes.

-- ============================================================
-- MÉTRICAS REAIS: dispositivo, retenção, churn
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_metricas_telemetria()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_users int;
  -- dispositivo (últimos 30d)
  dev_mobile int;
  dev_desktop int;
  dev_tablet int;
  dev_total int;
  -- retenção: usuários cadastrados há X dias que tiveram acesso nos últimos Y dias
  cohort_d7 int;  ret_d7 int;
  cohort_d30 int; ret_d30 int;
  cohort_d60 int; ret_d60 int;
  -- churn: usuários com primeiro acesso há >60d e sem acesso nos últimos 60d
  churn_base int;
  churn_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT COUNT(*) INTO total_users FROM public.profiles;

  -- Dispositivo (distinct user por tipo nos últimos 30d)
  SELECT
    COUNT(DISTINCT user_id) FILTER (WHERE device_type = 'mobile'),
    COUNT(DISTINCT user_id) FILTER (WHERE device_type = 'desktop'),
    COUNT(DISTINCT user_id) FILTER (WHERE device_type = 'tablet'),
    COUNT(DISTINCT user_id)
  INTO dev_mobile, dev_desktop, dev_tablet, dev_total
  FROM public.access_logs
  WHERE created_at >= now() - interval '30 days';

  -- Retenção D7: cadastrados entre 14 e 7 dias atrás que retornaram nos últimos 7 dias
  SELECT COUNT(*) INTO cohort_d7
  FROM public.profiles
  WHERE created_at BETWEEN now() - interval '14 days' AND now() - interval '7 days';

  SELECT COUNT(DISTINCT p.user_id) INTO ret_d7
  FROM public.profiles p
  JOIN public.access_logs al ON al.user_id = p.user_id
  WHERE p.created_at BETWEEN now() - interval '14 days' AND now() - interval '7 days'
    AND al.created_at >= now() - interval '7 days';

  -- Retenção D30
  SELECT COUNT(*) INTO cohort_d30
  FROM public.profiles
  WHERE created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days';

  SELECT COUNT(DISTINCT p.user_id) INTO ret_d30
  FROM public.profiles p
  JOIN public.access_logs al ON al.user_id = p.user_id
  WHERE p.created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days'
    AND al.created_at >= now() - interval '30 days';

  -- Retenção D60
  SELECT COUNT(*) INTO cohort_d60
  FROM public.profiles
  WHERE created_at BETWEEN now() - interval '120 days' AND now() - interval '60 days';

  SELECT COUNT(DISTINCT p.user_id) INTO ret_d60
  FROM public.profiles p
  JOIN public.access_logs al ON al.user_id = p.user_id
  WHERE p.created_at BETWEEN now() - interval '120 days' AND now() - interval '60 days'
    AND al.created_at >= now() - interval '60 days';

  -- Churn: usuários com algum acesso há >60d e nenhum acesso nos últimos 60d
  SELECT COUNT(DISTINCT user_id) INTO churn_base
  FROM public.access_logs
  WHERE created_at < now() - interval '60 days';

  SELECT COUNT(*) INTO churn_count
  FROM (
    SELECT user_id
    FROM public.access_logs
    WHERE created_at < now() - interval '60 days'
    GROUP BY user_id
    HAVING MAX(created_at) < now() - interval '60 days'
  ) sub;

  result := jsonb_build_object(
    'dispositivo_30d', jsonb_build_object(
      'mobile', dev_mobile,
      'desktop', dev_desktop,
      'tablet', dev_tablet,
      'total', dev_total,
      'pct_mobile', CASE WHEN dev_total > 0 THEN ROUND((dev_mobile::numeric / dev_total) * 100, 1) ELSE 0 END,
      'pct_desktop', CASE WHEN dev_total > 0 THEN ROUND((dev_desktop::numeric / dev_total) * 100, 1) ELSE 0 END,
      'pct_tablet', CASE WHEN dev_total > 0 THEN ROUND((dev_tablet::numeric / dev_total) * 100, 1) ELSE 0 END
    ),
    'retencao', jsonb_build_object(
      'd7', jsonb_build_object('cohort', cohort_d7, 'retornaram', ret_d7,
        'pct', CASE WHEN cohort_d7 > 0 THEN ROUND((ret_d7::numeric / cohort_d7) * 100, 1) ELSE 0 END),
      'd30', jsonb_build_object('cohort', cohort_d30, 'retornaram', ret_d30,
        'pct', CASE WHEN cohort_d30 > 0 THEN ROUND((ret_d30::numeric / cohort_d30) * 100, 1) ELSE 0 END),
      'd60', jsonb_build_object('cohort', cohort_d60, 'retornaram', ret_d60,
        'pct', CASE WHEN cohort_d60 > 0 THEN ROUND((ret_d60::numeric / cohort_d60) * 100, 1) ELSE 0 END)
    ),
    'churn', jsonb_build_object(
      'base', churn_base,
      'churned', churn_count,
      'pct', CASE WHEN churn_base > 0 THEN ROUND((churn_count::numeric / churn_base) * 100, 1) ELSE 0 END
    ),
    'total_eventos', (SELECT COUNT(*) FROM public.access_logs),
    'eventos_30d', (SELECT COUNT(*) FROM public.access_logs WHERE created_at >= now() - interval '30 days')
  );

  RETURN result;
END;
$$;

-- Série de acessos por dia (últimos N dias)
CREATE OR REPLACE FUNCTION public.admin_serie_acessos(_dias int DEFAULT 30)
RETURNS TABLE(dia date, acessos bigint, usuarios_unicos bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT
    d::date AS dia,
    COALESCE(COUNT(al.id), 0)::bigint AS acessos,
    COALESCE(COUNT(DISTINCT al.user_id), 0)::bigint AS usuarios_unicos
  FROM generate_series(
    (CURRENT_DATE - (_dias || ' days')::interval)::date,
    CURRENT_DATE,
    '1 day'::interval
  ) d
  LEFT JOIN public.access_logs al ON al.created_at::date = d::date
  GROUP BY d
  ORDER BY d;
END;
$$;