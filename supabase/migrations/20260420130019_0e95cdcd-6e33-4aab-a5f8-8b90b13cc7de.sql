-- ============================================================
-- FASE 3 — system_config + banner global + weekly_reports
-- ============================================================

-- 1) system_config (single-row config)
CREATE TABLE public.system_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true), -- garante única linha
  banner_ativo boolean NOT NULL DEFAULT false,
  banner_mensagem text,
  banner_tipo text NOT NULL DEFAULT 'info' CHECK (banner_tipo IN ('info','warning','success','error')),
  banner_atualizado_em timestamptz,
  banner_atualizado_por uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode LER (pra renderizar o banner)
CREATE POLICY system_config_select_all
  ON public.system_config FOR SELECT
  TO authenticated
  USING (true);

-- Só admin pode INSERIR/ATUALIZAR
CREATE POLICY system_config_insert_admin
  ON public.system_config FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY system_config_update_admin
  ON public.system_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Linha inicial
INSERT INTO public.system_config (id, banner_ativo, banner_mensagem, banner_tipo)
VALUES (true, false, NULL, 'info');

-- 2) weekly_reports
CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  gerado_em timestamptz NOT NULL DEFAULT now(),
  metricas jsonb NOT NULL DEFAULT '{}'::jsonb,
  csv_conteudo text,
  UNIQUE (periodo_inicio, periodo_fim)
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY weekly_reports_select_admin
  ON public.weekly_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Função que gera o relatório da semana anterior (segunda 00:00 → domingo 23:59)
CREATE OR REPLACE FUNCTION public.gerar_relatorio_semanal()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inicio date;
  v_fim date;
  v_metricas jsonb;
  v_csv text;
  v_id uuid;
  v_total_usuarios int;
  v_novos int;
  v_ativos int;
  v_total_aves int;
  v_total_baterias int;
  v_total_emprestimos int;
  v_total_acessos int;
  v_acessos_unicos int;
BEGIN
  -- Semana ISO anterior (segunda a domingo)
  v_inicio := (date_trunc('week', now()) - interval '7 days')::date;
  v_fim := (date_trunc('week', now()) - interval '1 day')::date;

  SELECT count(*) INTO v_total_usuarios FROM public.profiles;
  SELECT count(*) INTO v_novos FROM public.profiles
    WHERE created_at::date BETWEEN v_inicio AND v_fim;
  SELECT count(DISTINCT user_id) INTO v_ativos FROM public.access_logs
    WHERE created_at::date BETWEEN v_inicio AND v_fim;
  SELECT count(*) INTO v_total_aves FROM public.birds;
  SELECT count(*) INTO v_total_baterias FROM public.torneio_baterias
    WHERE created_at::date BETWEEN v_inicio AND v_fim;
  SELECT count(*) INTO v_total_emprestimos FROM public.bird_loans
    WHERE created_at::date BETWEEN v_inicio AND v_fim;
  SELECT count(*) INTO v_total_acessos FROM public.access_logs
    WHERE created_at::date BETWEEN v_inicio AND v_fim;
  SELECT count(DISTINCT user_id) INTO v_acessos_unicos FROM public.access_logs
    WHERE created_at::date BETWEEN v_inicio AND v_fim;

  v_metricas := jsonb_build_object(
    'periodo_inicio', v_inicio,
    'periodo_fim', v_fim,
    'total_usuarios', v_total_usuarios,
    'novos_usuarios', v_novos,
    'usuarios_ativos', v_ativos,
    'total_aves', v_total_aves,
    'baterias_criadas', v_total_baterias,
    'emprestimos_criados', v_total_emprestimos,
    'total_acessos', v_total_acessos,
    'acessos_unicos', v_acessos_unicos
  );

  v_csv := 'metrica,valor' || E'\n'
    || 'periodo_inicio,' || v_inicio || E'\n'
    || 'periodo_fim,' || v_fim || E'\n'
    || 'total_usuarios,' || v_total_usuarios || E'\n'
    || 'novos_usuarios,' || v_novos || E'\n'
    || 'usuarios_ativos,' || v_ativos || E'\n'
    || 'total_aves,' || v_total_aves || E'\n'
    || 'baterias_criadas,' || v_total_baterias || E'\n'
    || 'emprestimos_criados,' || v_total_emprestimos || E'\n'
    || 'total_acessos,' || v_total_acessos || E'\n'
    || 'acessos_unicos,' || v_acessos_unicos || E'\n';

  INSERT INTO public.weekly_reports (periodo_inicio, periodo_fim, metricas, csv_conteudo)
  VALUES (v_inicio, v_fim, v_metricas, v_csv)
  ON CONFLICT (periodo_inicio, periodo_fim)
  DO UPDATE SET metricas = EXCLUDED.metricas, csv_conteudo = EXCLUDED.csv_conteudo, gerado_em = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 4) Função admin pra gerar manualmente (botão na UI)
CREATE OR REPLACE FUNCTION public.admin_gerar_relatorio_semanal()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  RETURN public.gerar_relatorio_semanal();
END;
$$;

-- 5) Função admin pra atualizar banner (loga em admin_logs)
CREATE OR REPLACE FUNCTION public.admin_atualizar_banner(
  _ativo boolean,
  _mensagem text,
  _tipo text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF _tipo NOT IN ('info','warning','success','error') THEN
    RAISE EXCEPTION 'Tipo inválido';
  END IF;

  UPDATE public.system_config
  SET banner_ativo = _ativo,
      banner_mensagem = _mensagem,
      banner_tipo = _tipo,
      banner_atualizado_em = now(),
      banner_atualizado_por = auth.uid(),
      updated_at = now()
  WHERE id = true;

  INSERT INTO public.admin_logs (admin_user_id, acao, detalhes)
  VALUES (
    auth.uid(),
    CASE WHEN _ativo THEN 'banner_ativado' ELSE 'banner_desativado' END,
    jsonb_build_object('mensagem', _mensagem, 'tipo', _tipo)
  );
END;
$$;

-- 6) Garantir extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 7) Agendar job semanal (segundas 03:00 UTC = ~00:00 BRT)
DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'gerar-relatorio-semanal';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
END $$;

SELECT cron.schedule(
  'gerar-relatorio-semanal',
  '0 3 * * 1',
  $$ SELECT public.gerar_relatorio_semanal(); $$
);