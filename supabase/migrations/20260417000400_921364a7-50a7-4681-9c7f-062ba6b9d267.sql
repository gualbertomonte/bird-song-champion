-- 1) Coluna marcadora
ALTER TABLE public.birds
  ADD COLUMN IF NOT EXISTS gerado_no_bercario boolean NOT NULL DEFAULT false;

-- 2) Trigger BEFORE UPDATE: bloqueia alterar pai/mãe quando gerado_no_bercario
CREATE OR REPLACE FUNCTION public.protect_bercario_parents()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.gerado_no_bercario = true THEN
    IF NEW.pai_id IS DISTINCT FROM OLD.pai_id
       OR NEW.mae_id IS DISTINCT FROM OLD.mae_id THEN
      RAISE EXCEPTION 'Parentesco definido pelo berçário e não pode ser alterado';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_bercario_parents ON public.birds;
CREATE TRIGGER trg_protect_bercario_parents
BEFORE UPDATE ON public.birds
FOR EACH ROW
EXECUTE FUNCTION public.protect_bercario_parents();

-- 3) RPC transfer_bird: aceita e-mail ou código do criadouro
CREATE OR REPLACE FUNCTION public.transfer_bird(_bird_id uuid, _destinatario text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _bird public.birds;
  _input text := trim(coalesce(_destinatario, ''));
  _is_email boolean;
  _recipient_email text;
  _recipient_user_id uuid;
  _recipient_nome text;
  _sender_email text;
  _codigo text;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF _input = '' THEN
    RAISE EXCEPTION 'Informe o e-mail ou código do criadouro';
  END IF;

  SELECT * INTO _bird FROM public.birds WHERE id = _bird_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ave não encontrada';
  END IF;
  IF _bird.user_id <> _caller THEN
    RAISE EXCEPTION 'Você não é o dono desta ave';
  END IF;
  IF _bird.loan_status <> 'proprio' THEN
    RAISE EXCEPTION 'Esta ave está em empréstimo e não pode ser transferida';
  END IF;

  _is_email := position('@' in _input) > 0;

  IF _is_email THEN
    _recipient_email := lower(_input);
    SELECT user_id INTO _recipient_user_id FROM public.profiles
      WHERE lower(email) = _recipient_email LIMIT 1;
    IF _recipient_user_id IS NOT NULL THEN
      SELECT nome_criadouro INTO _recipient_nome FROM public.criador_profile
        WHERE user_id = _recipient_user_id LIMIT 1;
    END IF;
  ELSE
    _codigo := upper(_input);
    SELECT cp.user_id, cp.nome_criadouro
      INTO _recipient_user_id, _recipient_nome
      FROM public.criador_profile cp
      WHERE cp.codigo_criadouro = _codigo
      LIMIT 1;
    IF _recipient_user_id IS NULL THEN
      RAISE EXCEPTION 'Código de criadouro não encontrado';
    END IF;
    SELECT email INTO _recipient_email FROM public.profiles
      WHERE user_id = _recipient_user_id LIMIT 1;
    IF _recipient_email IS NULL THEN
      RAISE EXCEPTION 'Não foi possível localizar o e-mail do destinatário';
    END IF;
  END IF;

  IF _recipient_user_id = _caller THEN
    RAISE EXCEPTION 'Você não pode transferir para si mesmo';
  END IF;

  SELECT email INTO _sender_email FROM public.profiles
    WHERE user_id = _caller LIMIT 1;

  INSERT INTO public.pending_transfers (
    recipient_email, bird_data, sender_email,
    transferido_por_user_id, transferido_por_email
  ) VALUES (
    _recipient_email, to_jsonb(_bird), _sender_email,
    _caller, _sender_email
  );

  DELETE FROM public.birds WHERE id = _bird_id;

  RETURN jsonb_build_object(
    'recipient_email', _recipient_email,
    'recipient_nome', coalesce(_recipient_nome, '')
  );
END;
$$;