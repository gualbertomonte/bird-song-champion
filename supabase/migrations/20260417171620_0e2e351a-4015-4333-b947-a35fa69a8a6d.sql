
-- =========================================================
-- 1. SISTEMA DE AMIGOS
-- =========================================================

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  addressee_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'Pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT friendship_distinct CHECK (requester_user_id <> addressee_user_id),
  CONSTRAINT friendship_status_valid CHECK (status IN ('Pendente','Aceito','Rejeitado'))
);

-- Garante unicidade independente da direção (A->B == B->A)
CREATE UNIQUE INDEX friendships_pair_unique
  ON public.friendships (
    LEAST(requester_user_id, addressee_user_id),
    GREATEST(requester_user_id, addressee_user_id)
  );

CREATE INDEX friendships_requester_idx ON public.friendships(requester_user_id);
CREATE INDEX friendships_addressee_idx ON public.friendships(addressee_user_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select_envolvido"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_user_id OR auth.uid() = addressee_user_id);

-- Inserts/updates/deletes acontecem apenas pelas funções SECURITY DEFINER
-- (não criamos políticas permissivas para essas operações)

-- Função: enviar pedido por e-mail OU código de criadouro
CREATE OR REPLACE FUNCTION public.enviar_pedido_amizade(_destinatario text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _input text := trim(coalesce(_destinatario, ''));
  _is_email boolean;
  _addressee_id uuid;
  _addressee_email text;
  _addressee_nome text;
  _existing public.friendships;
  _new_id uuid;
  _caller_nome text;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF _input = '' THEN
    RAISE EXCEPTION 'Informe e-mail ou código do criadouro';
  END IF;

  _is_email := position('@' in _input) > 0;

  IF _is_email THEN
    SELECT user_id INTO _addressee_id FROM public.profiles
      WHERE lower(email) = lower(_input) LIMIT 1;
  ELSE
    SELECT user_id INTO _addressee_id FROM public.criador_profile
      WHERE codigo_criadouro = upper(_input) LIMIT 1;
  END IF;

  IF _addressee_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  IF _addressee_id = _caller THEN
    RAISE EXCEPTION 'Você não pode adicionar a si mesmo';
  END IF;

  -- Verifica se já existe amizade entre o par (em qualquer direção)
  SELECT * INTO _existing FROM public.friendships
   WHERE (requester_user_id = _caller AND addressee_user_id = _addressee_id)
      OR (requester_user_id = _addressee_id AND addressee_user_id = _caller)
   LIMIT 1;

  IF _existing.id IS NOT NULL THEN
    IF _existing.status = 'Aceito' THEN
      RAISE EXCEPTION 'Vocês já são amigos';
    ELSIF _existing.status = 'Pendente' THEN
      RAISE EXCEPTION 'Já existe um pedido pendente entre vocês';
    ELSIF _existing.status = 'Rejeitado' THEN
      -- Permite reenviar: atualiza para pendente trocando o requester se necessário
      UPDATE public.friendships
        SET requester_user_id = _caller,
            addressee_user_id = _addressee_id,
            status = 'Pendente',
            created_at = now(),
            responded_at = NULL
      WHERE id = _existing.id
      RETURNING id INTO _new_id;
    END IF;
  ELSE
    INSERT INTO public.friendships (requester_user_id, addressee_user_id)
    VALUES (_caller, _addressee_id)
    RETURNING id INTO _new_id;
  END IF;

  -- Dados para notificação
  SELECT email INTO _addressee_email FROM public.profiles WHERE user_id = _addressee_id;
  SELECT nome_criadouro INTO _caller_nome FROM public.criador_profile WHERE user_id = _caller;

  -- Notifica o destinatário
  INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
  VALUES (
    _addressee_id,
    'friend_request',
    'Novo pedido de amizade',
    coalesce(_caller_nome, 'Um criador') || ' quer ser seu amigo',
    '/amigos',
    jsonb_build_object('friendship_id', _new_id, 'requester_user_id', _caller)
  );

  RETURN jsonb_build_object('friendship_id', _new_id, 'addressee_email', _addressee_email);
END;
$$;

-- Função: aceitar/rejeitar pedido
CREATE OR REPLACE FUNCTION public.responder_pedido_amizade(_friendship_id uuid, _aceitar boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _f public.friendships;
  _addressee_nome text;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  SELECT * INTO _f FROM public.friendships WHERE id = _friendship_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF _f.addressee_user_id <> _caller THEN
    RAISE EXCEPTION 'Apenas o destinatário pode responder';
  END IF;
  IF _f.status <> 'Pendente' THEN
    RAISE EXCEPTION 'Pedido já respondido';
  END IF;

  UPDATE public.friendships
     SET status = CASE WHEN _aceitar THEN 'Aceito' ELSE 'Rejeitado' END,
         responded_at = now()
   WHERE id = _friendship_id;

  IF _aceitar THEN
    SELECT nome_criadouro INTO _addressee_nome FROM public.criador_profile WHERE user_id = _caller;
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (
      _f.requester_user_id,
      'friend_accepted',
      'Pedido aceito',
      coalesce(_addressee_nome, 'O criador') || ' aceitou seu pedido de amizade',
      '/amigos',
      jsonb_build_object('friendship_id', _friendship_id)
    );
  END IF;
END;
$$;

-- Função: remover amizade (qualquer um dos lados)
CREATE OR REPLACE FUNCTION public.remover_amizade(_friendship_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _f public.friendships;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _f FROM public.friendships WHERE id = _friendship_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Não encontrado'; END IF;
  IF _caller NOT IN (_f.requester_user_id, _f.addressee_user_id) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  DELETE FROM public.friendships WHERE id = _friendship_id;
END;
$$;

-- =========================================================
-- 2. TRATAMENTO MEDICAMENTOSO
-- =========================================================

CREATE TABLE public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bird_id uuid NOT NULL,
  medicamento text NOT NULL,
  dosagem text,
  via_administracao text,
  data_inicio date NOT NULL,
  duracao_dias int NOT NULL CHECK (duracao_dias > 0 AND duracao_dias <= 365),
  frequencia_diaria int NOT NULL DEFAULT 1 CHECK (frequencia_diaria BETWEEN 1 AND 12),
  hora_primeira_dose time NOT NULL DEFAULT '08:00',
  observacoes text,
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo','Concluido','Cancelado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX treatments_user_idx ON public.treatments(user_id);
CREATE INDEX treatments_bird_idx ON public.treatments(bird_id);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treatments_select_own" ON public.treatments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "treatments_insert_own" ON public.treatments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "treatments_update_own" ON public.treatments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "treatments_delete_own" ON public.treatments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER treatments_set_updated_at
BEFORE UPDATE ON public.treatments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tabela de doses
CREATE TABLE public.treatment_doses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  bird_id uuid NOT NULL,
  data_prevista timestamptz NOT NULL,
  aplicada_em timestamptz,
  aplicada_por_user_id uuid,
  observacoes_aplicacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX doses_user_data_idx ON public.treatment_doses(user_id, data_prevista);
CREATE INDEX doses_treatment_idx ON public.treatment_doses(treatment_id);

ALTER TABLE public.treatment_doses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doses_select_own" ON public.treatment_doses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "doses_update_own" ON public.treatment_doses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
-- inserts via função SECURITY DEFINER

-- Função: criar tratamento + gerar doses automaticamente
CREATE OR REPLACE FUNCTION public.criar_tratamento(
  _bird_id uuid,
  _medicamento text,
  _dosagem text,
  _via text,
  _data_inicio date,
  _duracao_dias int,
  _frequencia_diaria int,
  _hora_primeira time,
  _observacoes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _bird public.birds;
  _treatment_id uuid;
  _intervalo_horas numeric;
  _dose_dt timestamptz;
  d int; f int;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF _medicamento IS NULL OR trim(_medicamento) = '' THEN
    RAISE EXCEPTION 'Informe o medicamento';
  END IF;
  IF _duracao_dias < 1 OR _duracao_dias > 365 THEN
    RAISE EXCEPTION 'Duração inválida';
  END IF;
  IF _frequencia_diaria < 1 OR _frequencia_diaria > 12 THEN
    RAISE EXCEPTION 'Frequência inválida';
  END IF;

  SELECT * INTO _bird FROM public.birds WHERE id = _bird_id;
  IF NOT FOUND OR _bird.user_id <> _caller THEN
    RAISE EXCEPTION 'Ave inválida';
  END IF;

  INSERT INTO public.treatments (
    user_id, bird_id, medicamento, dosagem, via_administracao,
    data_inicio, duracao_dias, frequencia_diaria, hora_primeira_dose, observacoes
  ) VALUES (
    _caller, _bird_id, trim(_medicamento), _dosagem, _via,
    _data_inicio, _duracao_dias, _frequencia_diaria, _hora_primeira, _observacoes
  )
  RETURNING id INTO _treatment_id;

  _intervalo_horas := 24.0 / _frequencia_diaria;

  FOR d IN 0.._duracao_dias - 1 LOOP
    FOR f IN 0.._frequencia_diaria - 1 LOOP
      _dose_dt := (_data_inicio::timestamp + _hora_primeira)::timestamptz
                  + make_interval(days => d)
                  + make_interval(secs => (f * _intervalo_horas * 3600)::int);
      INSERT INTO public.treatment_doses (treatment_id, user_id, bird_id, data_prevista)
      VALUES (_treatment_id, _caller, _bird_id, _dose_dt);
    END LOOP;
  END LOOP;

  RETURN _treatment_id;
END;
$$;

-- Função: marcar dose aplicada
CREATE OR REPLACE FUNCTION public.marcar_dose_aplicada(
  _dose_id uuid,
  _observacoes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _dose public.treatment_doses;
  _pendentes int;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _dose FROM public.treatment_doses WHERE id = _dose_id;
  IF NOT FOUND OR _dose.user_id <> _caller THEN
    RAISE EXCEPTION 'Dose inválida';
  END IF;
  IF _dose.aplicada_em IS NOT NULL THEN
    RAISE EXCEPTION 'Dose já aplicada';
  END IF;

  UPDATE public.treatment_doses
     SET aplicada_em = now(),
         aplicada_por_user_id = _caller,
         observacoes_aplicacao = _observacoes
   WHERE id = _dose_id;

  -- Se não restam doses pendentes, marca tratamento como concluído
  SELECT count(*) INTO _pendentes FROM public.treatment_doses
   WHERE treatment_id = _dose.treatment_id AND aplicada_em IS NULL;
  IF _pendentes = 0 THEN
    UPDATE public.treatments SET status = 'Concluido' WHERE id = _dose.treatment_id;
  END IF;
END;
$$;
