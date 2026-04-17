
-- ============================================================
-- TORNEIO GRUPOS (comunidades fixas)
-- ============================================================

CREATE TABLE public.torneio_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  regulamento_padrao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.torneio_grupos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.torneio_grupo_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.torneio_grupos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  papel text NOT NULL DEFAULT 'membro' CHECK (papel IN ('admin','membro')),
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Pendente','Ativo','Saiu')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(grupo_id, user_id)
);
ALTER TABLE public.torneio_grupo_membros ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_grupo_membros_user ON public.torneio_grupo_membros(user_id, status);
CREATE INDEX idx_grupo_membros_grupo ON public.torneio_grupo_membros(grupo_id, status);

CREATE TABLE public.torneio_grupo_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.torneio_grupos(id) ON DELETE CASCADE,
  convidado_user_id uuid NOT NULL,
  convidado_por uuid NOT NULL,
  status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Aceito','Recusado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(grupo_id, convidado_user_id)
);
ALTER TABLE public.torneio_grupo_convites ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_grupo_convites_user ON public.torneio_grupo_convites(convidado_user_id, status);

CREATE TABLE public.torneio_baterias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.torneio_grupos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data date NOT NULL,
  numero_estacoes int NOT NULL DEFAULT 10,
  regulamento text,
  status text NOT NULL DEFAULT 'Inscricoes' CHECK (status IN ('Agendada','Inscricoes','Sorteada','Em andamento','Encerrada')),
  criado_por uuid NOT NULL,
  encerrado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.torneio_baterias ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_baterias_grupo ON public.torneio_baterias(grupo_id, status);

CREATE TABLE public.bateria_inscricoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bateria_id uuid NOT NULL REFERENCES public.torneio_baterias(id) ON DELETE CASCADE,
  membro_user_id uuid NOT NULL,
  bird_id uuid NOT NULL,
  bird_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Aprovada','Rejeitada')),
  estacao int,
  motivo_rejeicao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bateria_id, bird_id)
);
ALTER TABLE public.bateria_inscricoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bat_ins_bateria ON public.bateria_inscricoes(bateria_id, status);

CREATE TABLE public.bateria_pontuacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bateria_id uuid NOT NULL REFERENCES public.torneio_baterias(id) ON DELETE CASCADE,
  inscricao_id uuid NOT NULL UNIQUE REFERENCES public.bateria_inscricoes(id) ON DELETE CASCADE,
  pontos numeric NOT NULL DEFAULT 0,
  registrado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bateria_pontuacoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bat_pts_bateria ON public.bateria_pontuacoes(bateria_id);

-- ============================================================
-- HELPERS (SECURITY DEFINER, evitam recursão de RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_grupo_admin(_grupo_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.torneio_grupos
    WHERE id = _grupo_id AND admin_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_grupo_membro(_grupo_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.torneio_grupo_membros
    WHERE grupo_id = _grupo_id AND user_id = auth.uid() AND status = 'Ativo'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_bateria_admin(_bateria_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.torneio_baterias b
    JOIN public.torneio_grupos g ON g.id = b.grupo_id
    WHERE b.id = _bateria_id AND g.admin_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_bateria_membro(_bateria_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.torneio_baterias b
    JOIN public.torneio_grupo_membros m ON m.grupo_id = b.grupo_id
    WHERE b.id = _bateria_id AND m.user_id = auth.uid() AND m.status = 'Ativo'
  );
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- torneio_grupos
CREATE POLICY grupos_select ON public.torneio_grupos FOR SELECT TO authenticated
  USING (admin_user_id = auth.uid() OR public.is_grupo_membro(id));
CREATE POLICY grupos_insert ON public.torneio_grupos FOR INSERT TO authenticated
  WITH CHECK (admin_user_id = auth.uid());
CREATE POLICY grupos_update_admin ON public.torneio_grupos FOR UPDATE TO authenticated
  USING (admin_user_id = auth.uid()) WITH CHECK (admin_user_id = auth.uid());
CREATE POLICY grupos_delete_admin ON public.torneio_grupos FOR DELETE TO authenticated
  USING (admin_user_id = auth.uid());

-- torneio_grupo_membros
CREATE POLICY membros_select ON public.torneio_grupo_membros FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_grupo_admin(grupo_id) OR public.is_grupo_membro(grupo_id));

-- torneio_grupo_convites
CREATE POLICY convites_grupo_select ON public.torneio_grupo_convites FOR SELECT TO authenticated
  USING (convidado_user_id = auth.uid() OR public.is_grupo_admin(grupo_id));

-- torneio_baterias
CREATE POLICY baterias_select ON public.torneio_baterias FOR SELECT TO authenticated
  USING (public.is_grupo_admin(grupo_id) OR public.is_grupo_membro(grupo_id));

-- bateria_inscricoes
CREATE POLICY bat_ins_select ON public.bateria_inscricoes FOR SELECT TO authenticated
  USING (public.is_bateria_admin(bateria_id) OR public.is_bateria_membro(bateria_id));

-- bateria_pontuacoes
CREATE POLICY bat_pts_select ON public.bateria_pontuacoes FOR SELECT TO authenticated
  USING (public.is_bateria_admin(bateria_id) OR public.is_bateria_membro(bateria_id));

-- ============================================================
-- RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.criar_grupo_torneio(
  _nome text, _descricao text DEFAULT NULL, _regulamento text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller uuid := auth.uid();
  _grupo_id uuid;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF _nome IS NULL OR trim(_nome) = '' THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;

  INSERT INTO public.torneio_grupos (admin_user_id, nome, descricao, regulamento_padrao)
  VALUES (_caller, trim(_nome), _descricao, _regulamento)
  RETURNING id INTO _grupo_id;

  INSERT INTO public.torneio_grupo_membros (grupo_id, user_id, papel, status)
  VALUES (_grupo_id, _caller, 'admin', 'Ativo');

  RETURN _grupo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.convidar_membro_grupo(_grupo_id uuid, _user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller uuid := auth.uid();
  _convite_id uuid;
  _grupo_nome text;
  _admin_nome text;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_grupo_admin(_grupo_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode convidar';
  END IF;
  IF _user_id = _caller THEN RAISE EXCEPTION 'Você já é admin'; END IF;

  -- Verifica se já é membro ativo
  IF EXISTS (SELECT 1 FROM public.torneio_grupo_membros
             WHERE grupo_id = _grupo_id AND user_id = _user_id AND status = 'Ativo') THEN
    RAISE EXCEPTION 'Usuário já é membro';
  END IF;

  -- Reaproveita convite existente
  INSERT INTO public.torneio_grupo_convites (grupo_id, convidado_user_id, convidado_por)
  VALUES (_grupo_id, _user_id, _caller)
  ON CONFLICT (grupo_id, convidado_user_id) DO UPDATE
    SET status = 'Pendente', responded_at = NULL, created_at = now(), convidado_por = _caller
  RETURNING id INTO _convite_id;

  SELECT nome INTO _grupo_nome FROM public.torneio_grupos WHERE id = _grupo_id;
  SELECT nome_criadouro INTO _admin_nome FROM public.criador_profile WHERE user_id = _caller;

  INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
  VALUES (_user_id, 'grupo_convite', 'Convite para grupo de torneio',
    coalesce(_admin_nome,'Um criador') || ' te convidou para o grupo "' || _grupo_nome || '"',
    '/grupos',
    jsonb_build_object('grupo_id', _grupo_id, 'convite_id', _convite_id));

  RETURN _convite_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.responder_convite_grupo(_convite_id uuid, _aceitar boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller uuid := auth.uid();
  _c public.torneio_grupo_convites;
  _grupo_nome text;
  _user_nome text;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _c FROM public.torneio_grupo_convites WHERE id = _convite_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite não encontrado'; END IF;
  IF _c.convidado_user_id <> _caller THEN RAISE EXCEPTION 'Apenas o destinatário pode responder'; END IF;
  IF _c.status <> 'Pendente' THEN RAISE EXCEPTION 'Convite já respondido'; END IF;

  UPDATE public.torneio_grupo_convites
    SET status = CASE WHEN _aceitar THEN 'Aceito' ELSE 'Recusado' END,
        responded_at = now()
    WHERE id = _convite_id;

  IF _aceitar THEN
    INSERT INTO public.torneio_grupo_membros (grupo_id, user_id, papel, status)
    VALUES (_c.grupo_id, _caller, 'membro', 'Ativo')
    ON CONFLICT (grupo_id, user_id) DO UPDATE SET status = 'Ativo';

    SELECT nome INTO _grupo_nome FROM public.torneio_grupos WHERE id = _c.grupo_id;
    SELECT nome_criadouro INTO _user_nome FROM public.criador_profile WHERE user_id = _caller;

    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_c.convidado_por, 'grupo_aceito', 'Convite aceito',
      coalesce(_user_nome,'Um criador') || ' aceitou entrar no grupo "' || _grupo_nome || '"',
      '/grupos/' || _c.grupo_id,
      jsonb_build_object('grupo_id', _c.grupo_id));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sair_do_grupo(_grupo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller uuid := auth.uid();
  _g public.torneio_grupos;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _g FROM public.torneio_grupos WHERE id = _grupo_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Grupo não encontrado'; END IF;
  IF _g.admin_user_id = _caller THEN
    RAISE EXCEPTION 'Admin não pode sair do grupo (exclua o grupo)';
  END IF;
  UPDATE public.torneio_grupo_membros SET status = 'Saiu'
    WHERE grupo_id = _grupo_id AND user_id = _caller;
END;
$$;

CREATE OR REPLACE FUNCTION public.criar_bateria(
  _grupo_id uuid, _nome text, _data date, _numero_estacoes int, _regulamento text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller uuid := auth.uid();
  _bat_id uuid;
  _grupo_nome text;
  _membro record;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_grupo_admin(_grupo_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode criar baterias';
  END IF;
  IF _nome IS NULL OR trim(_nome) = '' THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;
  IF _numero_estacoes < 1 THEN RAISE EXCEPTION 'Número de estações inválido'; END IF;

  INSERT INTO public.torneio_baterias (grupo_id, nome, data, numero_estacoes, regulamento, criado_por)
  VALUES (_grupo_id, trim(_nome), _data, _numero_estacoes, _regulamento, _caller)
  RETURNING id INTO _bat_id;

  -- Notifica todos os membros ativos
  SELECT nome INTO _grupo_nome FROM public.torneio_grupos WHERE id = _grupo_id;
  FOR _membro IN
    SELECT user_id FROM public.torneio_grupo_membros
    WHERE grupo_id = _grupo_id AND status = 'Ativo' AND user_id <> _caller
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_membro.user_id, 'bateria_criada', 'Nova bateria',
      'Nova bateria "' || _nome || '" criada no grupo "' || _grupo_nome || '"',
      '/grupos/' || _grupo_id || '/baterias/' || _bat_id,
      jsonb_build_object('grupo_id', _grupo_id, 'bateria_id', _bat_id));
  END LOOP;

  RETURN _bat_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.inscrever_ave_bateria(_bateria_id uuid, _bird_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller uuid := auth.uid();
  _bat public.torneio_baterias;
  _bird public.birds;
  _ins_id uuid;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bateria não encontrada'; END IF;
  IF _bat.status NOT IN ('Agendada','Inscricoes') THEN
    RAISE EXCEPTION 'Inscrições encerradas';
  END IF;
  IF NOT public.is_bateria_membro(_bateria_id) AND NOT public.is_bateria_admin(_bateria_id) THEN
    RAISE EXCEPTION 'Você não é membro deste grupo';
  END IF;
  SELECT * INTO _bird FROM public.birds WHERE id = _bird_id;
  IF NOT FOUND OR _bird.user_id <> _caller THEN RAISE EXCEPTION 'Ave inválida'; END IF;
  IF _bird.sexo <> 'M' THEN RAISE EXCEPTION 'Apenas machos podem participar'; END IF;

  INSERT INTO public.bateria_inscricoes (bateria_id, membro_user_id, bird_id, bird_snapshot)
  VALUES (_bateria_id, _caller, _bird_id, to_jsonb(_bird))
  RETURNING id INTO _ins_id;

  RETURN _ins_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.aprovar_inscricao_bateria(
  _inscricao_id uuid, _aprovar boolean, _motivo text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ins public.bateria_inscricoes;
  _bat_nome text;
BEGIN
  SELECT * INTO _ins FROM public.bateria_inscricoes WHERE id = _inscricao_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;
  IF NOT public.is_bateria_admin(_ins.bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode aprovar';
  END IF;

  UPDATE public.bateria_inscricoes
    SET status = CASE WHEN _aprovar THEN 'Aprovada' ELSE 'Rejeitada' END,
        motivo_rejeicao = CASE WHEN _aprovar THEN NULL ELSE _motivo END,
        updated_at = now()
    WHERE id = _inscricao_id;

  IF _aprovar THEN
    SELECT nome INTO _bat_nome FROM public.torneio_baterias WHERE id = _ins.bateria_id;
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_ins.membro_user_id, 'inscricao_aprovada', 'Inscrição aprovada',
      'Sua ave foi aprovada na bateria "' || _bat_nome || '"',
      '/grupos/baterias/' || _ins.bateria_id,
      jsonb_build_object('bateria_id', _ins.bateria_id));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sortear_estacoes_bateria(_bateria_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _bat public.torneio_baterias;
  _aprovadas int;
BEGIN
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bateria não encontrada'; END IF;
  IF NOT public.is_bateria_admin(_bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode sortear';
  END IF;
  IF _bat.status NOT IN ('Agendada','Inscricoes','Sorteada') THEN
    RAISE EXCEPTION 'Sorteio não permitido neste status';
  END IF;

  SELECT count(*) INTO _aprovadas FROM public.bateria_inscricoes
    WHERE bateria_id = _bateria_id AND status = 'Aprovada';
  IF _aprovadas = 0 THEN RAISE EXCEPTION 'Nenhuma ave aprovada'; END IF;
  IF _aprovadas > _bat.numero_estacoes THEN
    RAISE EXCEPTION 'Aves aprovadas (%) excedem nº de estações (%)', _aprovadas, _bat.numero_estacoes;
  END IF;

  UPDATE public.bateria_inscricoes SET estacao = NULL WHERE bateria_id = _bateria_id;

  WITH sorteio AS (
    SELECT id, row_number() OVER (ORDER BY random()) AS pos
      FROM public.bateria_inscricoes
     WHERE bateria_id = _bateria_id AND status = 'Aprovada'
  )
  UPDATE public.bateria_inscricoes bi
     SET estacao = s.pos, updated_at = now()
    FROM sorteio s
   WHERE bi.id = s.id;

  UPDATE public.torneio_baterias SET status = 'Sorteada', updated_at = now() WHERE id = _bateria_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_pontuacao_bateria(_inscricao_id uuid, _pontos numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _caller uuid := auth.uid();
  _ins public.bateria_inscricoes;
  _bat public.torneio_baterias;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _ins FROM public.bateria_inscricoes WHERE id = _inscricao_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _ins.bateria_id;
  IF NOT public.is_bateria_admin(_ins.bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode lançar pontuação';
  END IF;
  IF _bat.status = 'Encerrada' THEN RAISE EXCEPTION 'Bateria encerrada — pontuação bloqueada'; END IF;
  IF _ins.status <> 'Aprovada' THEN RAISE EXCEPTION 'Inscrição não aprovada'; END IF;

  INSERT INTO public.bateria_pontuacoes (bateria_id, inscricao_id, pontos, registrado_por)
  VALUES (_ins.bateria_id, _inscricao_id, _pontos, _caller)
  ON CONFLICT (inscricao_id) DO UPDATE
    SET pontos = EXCLUDED.pontos, updated_at = now(), registrado_por = _caller;

  IF _bat.status = 'Sorteada' THEN
    UPDATE public.torneio_baterias SET status = 'Em andamento', updated_at = now()
    WHERE id = _ins.bateria_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.encerrar_bateria(_bateria_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _bat public.torneio_baterias;
  _grupo_nome text;
  _membro record;
BEGIN
  IF NOT public.is_bateria_admin(_bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode encerrar';
  END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  UPDATE public.torneio_baterias
    SET status = 'Encerrada', encerrado_em = now(), updated_at = now()
    WHERE id = _bateria_id;

  SELECT nome INTO _grupo_nome FROM public.torneio_grupos WHERE id = _bat.grupo_id;
  FOR _membro IN
    SELECT DISTINCT membro_user_id FROM public.bateria_inscricoes
    WHERE bateria_id = _bateria_id AND status = 'Aprovada'
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_membro.membro_user_id, 'bateria_encerrada', 'Bateria encerrada',
      'A bateria "' || _bat.nome || '" do grupo "' || _grupo_nome || '" foi encerrada',
      '/grupos/' || _bat.grupo_id || '/baterias/' || _bateria_id,
      jsonb_build_object('bateria_id', _bateria_id));
  END LOOP;
END;
$$;

-- ============================================================
-- VIEW: ranking acumulado do grupo (apenas baterias encerradas)
-- ============================================================

CREATE OR REPLACE VIEW public.ranking_acumulado_grupo AS
SELECT
  b.grupo_id,
  bi.membro_user_id,
  bi.bird_id,
  (bi.bird_snapshot->>'nome') AS bird_nome,
  (bi.bird_snapshot->>'codigo_anilha') AS codigo_anilha,
  COUNT(DISTINCT b.id) AS baterias_disputadas,
  COALESCE(SUM(bp.pontos), 0) AS total_pontos
FROM public.bateria_inscricoes bi
JOIN public.torneio_baterias b ON b.id = bi.bateria_id
LEFT JOIN public.bateria_pontuacoes bp ON bp.inscricao_id = bi.id
WHERE b.status = 'Encerrada' AND bi.status = 'Aprovada'
GROUP BY b.grupo_id, bi.membro_user_id, bi.bird_id, bi.bird_snapshot;

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER trg_grupos_updated BEFORE UPDATE ON public.torneio_grupos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_baterias_updated BEFORE UPDATE ON public.torneio_baterias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bat_ins_updated BEFORE UPDATE ON public.bateria_inscricoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bat_pts_updated BEFORE UPDATE ON public.bateria_pontuacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bateria_inscricoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bateria_pontuacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.torneio_baterias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.torneio_grupo_membros;
ALTER PUBLICATION supabase_realtime ADD TABLE public.torneio_grupo_convites;
