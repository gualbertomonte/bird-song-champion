
-- =========================================================
-- TORNEIOS COLABORATIVOS
-- =========================================================

-- 1. TABELAS

CREATE TABLE public.torneios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id uuid NOT NULL,
  nome text NOT NULL,
  data date NOT NULL,
  regulamento text,
  numero_estacoes int NOT NULL DEFAULT 10 CHECK (numero_estacoes > 0 AND numero_estacoes <= 500),
  numero_baterias int NOT NULL DEFAULT 1 CHECK (numero_baterias > 0 AND numero_baterias <= 50),
  status text NOT NULL DEFAULT 'Rascunho'
    CHECK (status IN ('Rascunho','Inscricoes','Sorteado','Em andamento','Encerrado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  encerrado_em timestamptz
);

CREATE INDEX idx_torneios_organizer ON public.torneios(organizer_user_id);
CREATE INDEX idx_torneios_status ON public.torneios(status);

CREATE TABLE public.torneio_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  torneio_id uuid NOT NULL REFERENCES public.torneios(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('email','link_aberto')),
  email_convidado text,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Aceito','Recusado','Expirado')),
  accepted_user_id uuid,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_convites_torneio ON public.torneio_convites(torneio_id);
CREATE INDEX idx_convites_token ON public.torneio_convites(token);
CREATE INDEX idx_convites_email ON public.torneio_convites(lower(email_convidado));

CREATE TABLE public.torneio_participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  torneio_id uuid NOT NULL REFERENCES public.torneios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (torneio_id, user_id)
);

CREATE INDEX idx_participantes_torneio ON public.torneio_participantes(torneio_id);
CREATE INDEX idx_participantes_user ON public.torneio_participantes(user_id);

CREATE TABLE public.torneio_inscricoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  torneio_id uuid NOT NULL REFERENCES public.torneios(id) ON DELETE CASCADE,
  participante_user_id uuid NOT NULL,
  bird_id uuid NOT NULL,
  bird_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Aprovada','Rejeitada')),
  motivo_rejeicao text,
  estacao int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (torneio_id, bird_id)
);

CREATE INDEX idx_inscricoes_torneio ON public.torneio_inscricoes(torneio_id);
CREATE INDEX idx_inscricoes_user ON public.torneio_inscricoes(participante_user_id);

CREATE TABLE public.torneio_pontuacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  torneio_id uuid NOT NULL REFERENCES public.torneios(id) ON DELETE CASCADE,
  inscricao_id uuid NOT NULL REFERENCES public.torneio_inscricoes(id) ON DELETE CASCADE,
  bateria int NOT NULL DEFAULT 1,
  pontos numeric NOT NULL DEFAULT 0,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inscricao_id, bateria)
);

CREATE INDEX idx_pontuacoes_torneio ON public.torneio_pontuacoes(torneio_id);
CREATE INDEX idx_pontuacoes_inscricao ON public.torneio_pontuacoes(inscricao_id);

CREATE TABLE public.torneio_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  torneio_id uuid NOT NULL,
  inscricao_id uuid,
  acao text NOT NULL,
  pontos_anterior numeric,
  pontos_novo numeric,
  bateria int,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_torneio ON public.torneio_audit_log(torneio_id);

-- 2. TRIGGERS

CREATE TRIGGER trg_torneios_updated_at
  BEFORE UPDATE ON public.torneios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_inscricoes_updated_at
  BEFORE UPDATE ON public.torneio_inscricoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_pontuacoes_updated_at
  BEFORE UPDATE ON public.torneio_pontuacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.log_pontuacao_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.torneio_audit_log(torneio_id, inscricao_id, acao, pontos_anterior, pontos_novo, bateria, user_id)
    VALUES (NEW.torneio_id, NEW.inscricao_id, 'insert', NULL, NEW.pontos, NEW.bateria, COALESCE(auth.uid(), NEW.created_by_user_id));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.torneio_audit_log(torneio_id, inscricao_id, acao, pontos_anterior, pontos_novo, bateria, user_id)
    VALUES (NEW.torneio_id, NEW.inscricao_id, 'update', OLD.pontos, NEW.pontos, NEW.bateria, COALESCE(auth.uid(), NEW.created_by_user_id));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.torneio_audit_log(torneio_id, inscricao_id, acao, pontos_anterior, pontos_novo, bateria, user_id)
    VALUES (OLD.torneio_id, OLD.inscricao_id, 'delete', OLD.pontos, NULL, OLD.bateria, COALESCE(auth.uid(), OLD.created_by_user_id));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_pontuacoes_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.torneio_pontuacoes
  FOR EACH ROW EXECUTE FUNCTION public.log_pontuacao_change();

-- 3. RLS

ALTER TABLE public.torneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneio_convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneio_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneio_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneio_pontuacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneio_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: caller é organizador?
CREATE OR REPLACE FUNCTION public.is_torneio_organizer(_torneio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.torneios
     WHERE id = _torneio_id AND organizer_user_id = auth.uid()
  );
$$;

-- Helper: caller é participante?
CREATE OR REPLACE FUNCTION public.is_torneio_participante(_torneio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.torneio_participantes
     WHERE torneio_id = _torneio_id AND user_id = auth.uid()
  );
$$;

-- torneios
CREATE POLICY "torneios_select" ON public.torneios FOR SELECT TO authenticated
  USING (organizer_user_id = auth.uid() OR public.is_torneio_participante(id));

CREATE POLICY "torneios_insert" ON public.torneios FOR INSERT TO authenticated
  WITH CHECK (organizer_user_id = auth.uid());

CREATE POLICY "torneios_update_organizer" ON public.torneios FOR UPDATE TO authenticated
  USING (organizer_user_id = auth.uid())
  WITH CHECK (organizer_user_id = auth.uid());

CREATE POLICY "torneios_delete_organizer" ON public.torneios FOR DELETE TO authenticated
  USING (organizer_user_id = auth.uid() AND status IN ('Rascunho','Inscricoes'));

-- torneio_convites: organizador gerencia; convidado por e-mail vê o seu
CREATE POLICY "convites_select" ON public.torneio_convites FOR SELECT TO authenticated
  USING (
    public.is_torneio_organizer(torneio_id)
    OR (tipo = 'email' AND lower(email_convidado) = lower(auth.jwt() ->> 'email'))
  );

CREATE POLICY "convites_insert_organizer" ON public.torneio_convites FOR INSERT TO authenticated
  WITH CHECK (public.is_torneio_organizer(torneio_id));

CREATE POLICY "convites_update_organizer" ON public.torneio_convites FOR UPDATE TO authenticated
  USING (public.is_torneio_organizer(torneio_id));

CREATE POLICY "convites_delete_organizer" ON public.torneio_convites FOR DELETE TO authenticated
  USING (public.is_torneio_organizer(torneio_id));

-- torneio_participantes: organizador e o próprio veem
CREATE POLICY "participantes_select" ON public.torneio_participantes FOR SELECT TO authenticated
  USING (public.is_torneio_organizer(torneio_id) OR user_id = auth.uid());

-- INSERT/DELETE só via RPC (sem policy = bloqueado para client direto)

-- torneio_inscricoes: SELECT por organizador e por todos os participantes do torneio
CREATE POLICY "inscricoes_select" ON public.torneio_inscricoes FOR SELECT TO authenticated
  USING (
    public.is_torneio_organizer(torneio_id)
    OR public.is_torneio_participante(torneio_id)
  );

CREATE POLICY "inscricoes_insert_owner" ON public.torneio_inscricoes FOR INSERT TO authenticated
  WITH CHECK (
    participante_user_id = auth.uid()
    AND public.is_torneio_participante(torneio_id)
  );

CREATE POLICY "inscricoes_delete_owner" ON public.torneio_inscricoes FOR DELETE TO authenticated
  USING (
    participante_user_id = auth.uid()
    AND status = 'Pendente'
  );

-- UPDATE (estação, status) só via RPC

-- torneio_pontuacoes: SELECT todos do torneio; INSERT/UPDATE/DELETE só via RPC
CREATE POLICY "pontuacoes_select" ON public.torneio_pontuacoes FOR SELECT TO authenticated
  USING (
    public.is_torneio_organizer(torneio_id)
    OR public.is_torneio_participante(torneio_id)
  );

-- audit log: só organizador
CREATE POLICY "audit_select_organizer" ON public.torneio_audit_log FOR SELECT TO authenticated
  USING (public.is_torneio_organizer(torneio_id));

-- 4. RPCs

CREATE OR REPLACE FUNCTION public.aceitar_convite_torneio(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _email text := lower(auth.jwt() ->> 'email');
  _convite public.torneio_convites;
  _torneio public.torneios;
  _participantes_count int;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _convite FROM public.torneio_convites WHERE token = _token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido';
  END IF;

  SELECT * INTO _torneio FROM public.torneios WHERE id = _convite.torneio_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Torneio não encontrado';
  END IF;

  IF _torneio.status NOT IN ('Rascunho','Inscricoes') THEN
    RAISE EXCEPTION 'Inscrições encerradas para este torneio';
  END IF;

  IF _convite.tipo = 'email' THEN
    IF lower(_convite.email_convidado) <> _email THEN
      RAISE EXCEPTION 'Este convite é para outro e-mail';
    END IF;
    IF _convite.status = 'Aceito' AND _convite.accepted_user_id <> _caller THEN
      RAISE EXCEPTION 'Convite já utilizado';
    END IF;
  ELSE
    -- link aberto: limita pelo nº de estações
    SELECT count(*) INTO _participantes_count
      FROM public.torneio_participantes WHERE torneio_id = _torneio.id;
    IF _participantes_count >= _torneio.numero_estacoes THEN
      RAISE EXCEPTION 'Torneio já atingiu o número máximo de participantes';
    END IF;
  END IF;

  INSERT INTO public.torneio_participantes (torneio_id, user_id)
  VALUES (_torneio.id, _caller)
  ON CONFLICT (torneio_id, user_id) DO NOTHING;

  IF _convite.tipo = 'email' THEN
    UPDATE public.torneio_convites
       SET status = 'Aceito', accepted_user_id = _caller, accepted_at = now()
     WHERE id = _convite.id;
  END IF;

  -- promove para Inscricoes se ainda Rascunho
  IF _torneio.status = 'Rascunho' THEN
    UPDATE public.torneios SET status = 'Inscricoes' WHERE id = _torneio.id;
  END IF;

  RETURN jsonb_build_object('torneio_id', _torneio.id, 'nome', _torneio.nome);
END;
$$;

CREATE OR REPLACE FUNCTION public.inscrever_ave_torneio(_torneio_id uuid, _bird_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _bird public.birds;
  _torneio public.torneios;
  _inscricao_id uuid;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _torneio FROM public.torneios WHERE id = _torneio_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Torneio não encontrado'; END IF;

  IF _torneio.status NOT IN ('Rascunho','Inscricoes') THEN
    RAISE EXCEPTION 'Inscrições encerradas';
  END IF;

  IF NOT public.is_torneio_participante(_torneio_id)
     AND _torneio.organizer_user_id <> _caller THEN
    RAISE EXCEPTION 'Você não é participante deste torneio';
  END IF;

  SELECT * INTO _bird FROM public.birds WHERE id = _bird_id;
  IF NOT FOUND OR _bird.user_id <> _caller THEN
    RAISE EXCEPTION 'Ave inválida';
  END IF;

  INSERT INTO public.torneio_inscricoes (torneio_id, participante_user_id, bird_id, bird_snapshot)
  VALUES (_torneio_id, _caller, _bird_id, to_jsonb(_bird))
  RETURNING id INTO _inscricao_id;

  RETURN _inscricao_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.aprovar_inscricao(_inscricao_id uuid, _aprovar boolean, _motivo text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ins public.torneio_inscricoes;
BEGIN
  SELECT * INTO _ins FROM public.torneio_inscricoes WHERE id = _inscricao_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;

  IF NOT public.is_torneio_organizer(_ins.torneio_id) THEN
    RAISE EXCEPTION 'Apenas o organizador pode aprovar';
  END IF;

  UPDATE public.torneio_inscricoes
     SET status = CASE WHEN _aprovar THEN 'Aprovada' ELSE 'Rejeitada' END,
         motivo_rejeicao = CASE WHEN _aprovar THEN NULL ELSE _motivo END
   WHERE id = _inscricao_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sortear_estacoes(_torneio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _torneio public.torneios;
  _aprovadas int;
BEGIN
  SELECT * INTO _torneio FROM public.torneios WHERE id = _torneio_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Torneio não encontrado'; END IF;

  IF NOT public.is_torneio_organizer(_torneio_id) THEN
    RAISE EXCEPTION 'Apenas o organizador pode sortear';
  END IF;

  IF _torneio.status NOT IN ('Inscricoes','Sorteado') THEN
    RAISE EXCEPTION 'Sorteio só é possível antes de iniciar o torneio';
  END IF;

  SELECT count(*) INTO _aprovadas
    FROM public.torneio_inscricoes
   WHERE torneio_id = _torneio_id AND status = 'Aprovada';

  IF _aprovadas = 0 THEN
    RAISE EXCEPTION 'Nenhuma ave aprovada para sortear';
  END IF;

  IF _aprovadas > _torneio.numero_estacoes THEN
    RAISE EXCEPTION 'Aves aprovadas (%) excedem número de estações (%)', _aprovadas, _torneio.numero_estacoes;
  END IF;

  -- limpa estações
  UPDATE public.torneio_inscricoes SET estacao = NULL WHERE torneio_id = _torneio_id;

  -- sorteia
  WITH sorteio AS (
    SELECT id, row_number() OVER (ORDER BY random()) AS pos
      FROM public.torneio_inscricoes
     WHERE torneio_id = _torneio_id AND status = 'Aprovada'
  )
  UPDATE public.torneio_inscricoes ti
     SET estacao = s.pos
    FROM sorteio s
   WHERE ti.id = s.id;

  UPDATE public.torneios SET status = 'Sorteado' WHERE id = _torneio_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_pontuacao(_inscricao_id uuid, _bateria int, _pontos numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _ins public.torneio_inscricoes;
  _torneio public.torneios;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  SELECT * INTO _ins FROM public.torneio_inscricoes WHERE id = _inscricao_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;

  SELECT * INTO _torneio FROM public.torneios WHERE id = _ins.torneio_id;

  IF NOT public.is_torneio_organizer(_ins.torneio_id) THEN
    RAISE EXCEPTION 'Apenas o organizador pode lançar pontuação';
  END IF;

  IF _torneio.status = 'Encerrado' THEN
    RAISE EXCEPTION 'Torneio encerrado — pontuação bloqueada';
  END IF;

  IF _bateria < 1 OR _bateria > _torneio.numero_baterias THEN
    RAISE EXCEPTION 'Bateria inválida (1..%)', _torneio.numero_baterias;
  END IF;

  IF _ins.status <> 'Aprovada' THEN
    RAISE EXCEPTION 'Ave não está aprovada';
  END IF;

  INSERT INTO public.torneio_pontuacoes (torneio_id, inscricao_id, bateria, pontos, created_by_user_id)
  VALUES (_ins.torneio_id, _inscricao_id, _bateria, _pontos, _caller)
  ON CONFLICT (inscricao_id, bateria)
  DO UPDATE SET pontos = EXCLUDED.pontos, updated_at = now(), created_by_user_id = _caller;

  -- promove para Em andamento
  IF _torneio.status = 'Sorteado' THEN
    UPDATE public.torneios SET status = 'Em andamento' WHERE id = _torneio.id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.encerrar_torneio(_torneio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_torneio_organizer(_torneio_id) THEN
    RAISE EXCEPTION 'Apenas o organizador pode encerrar';
  END IF;

  UPDATE public.torneios
     SET status = 'Encerrado', encerrado_em = now()
   WHERE id = _torneio_id;
END;
$$;

-- 5. REALTIME

ALTER PUBLICATION supabase_realtime ADD TABLE public.torneio_pontuacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.torneio_inscricoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.torneios;

ALTER TABLE public.torneio_pontuacoes REPLICA IDENTITY FULL;
ALTER TABLE public.torneio_inscricoes REPLICA IDENTITY FULL;
ALTER TABLE public.torneios REPLICA IDENTITY FULL;
