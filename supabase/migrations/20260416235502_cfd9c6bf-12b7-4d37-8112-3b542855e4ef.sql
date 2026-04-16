
-- Speed up loan return cleanup
CREATE INDEX IF NOT EXISTS idx_birds_original_bird_loan_status
  ON public.birds (original_bird_id, loan_status);

-- Atomic create_loan RPC: validates ownership, creates loan record,
-- marks owner bird as emprestada_saida, AND inserts the borrower clone
-- (bypassing RLS via SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.create_loan(
  _bird_id uuid,
  _codigo_criadouro text,
  _prazo date DEFAULT NULL,
  _observacoes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _bird public.birds;
  _borrower_user_id uuid;
  _borrower_email text;
  _borrower_nome text;
  _codigo text := upper(trim(_codigo_criadouro));
  _existing_clone uuid;
  _existing_own uuid;
  _loan_id uuid;
  _clone_id uuid;
  _owner_email text;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Load bird & validate ownership
  SELECT * INTO _bird FROM public.birds WHERE id = _bird_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ave não encontrada';
  END IF;
  IF _bird.user_id <> _caller THEN
    RAISE EXCEPTION 'Você não é o dono desta ave';
  END IF;
  IF _bird.loan_status <> 'proprio' THEN
    RAISE EXCEPTION 'Esta ave já está em empréstimo';
  END IF;

  -- Resolve borrower
  SELECT cp.user_id, COALESCE(cp.nome_criadouro, '')
    INTO _borrower_user_id, _borrower_nome
    FROM public.criador_profile cp
   WHERE cp.codigo_criadouro = _codigo
   LIMIT 1;
  IF _borrower_user_id IS NULL THEN
    RAISE EXCEPTION 'Código de criadouro não encontrado';
  END IF;
  IF _borrower_user_id = _caller THEN
    RAISE EXCEPTION 'Você não pode emprestar para si mesmo';
  END IF;

  SELECT email INTO _borrower_email FROM public.profiles
   WHERE user_id = _borrower_user_id LIMIT 1;
  IF _borrower_email IS NULL THEN
    RAISE EXCEPTION 'Não foi possível localizar o e-mail do destinatário';
  END IF;

  SELECT email INTO _owner_email FROM public.profiles
   WHERE user_id = _caller LIMIT 1;

  -- Edge case: borrower already owns a bird with that anilha (proprio)
  SELECT id INTO _existing_own FROM public.birds
   WHERE user_id = _borrower_user_id
     AND codigo_anilha = _bird.codigo_anilha
     AND loan_status = 'proprio'
   LIMIT 1;
  IF _existing_own IS NOT NULL THEN
    RAISE EXCEPTION 'Recebedor já possui ave com essa anilha (%)', _bird.codigo_anilha;
  END IF;

  -- Create loan
  INSERT INTO public.bird_loans (
    bird_id, bird_snapshot, owner_user_id, owner_email,
    borrower_user_id, borrower_email, borrower_codigo_criadouro,
    prazo_devolucao, observacoes, status
  ) VALUES (
    _bird.id, to_jsonb(_bird), _caller, _owner_email,
    _borrower_user_id, _borrower_email, _codigo,
    _prazo, _observacoes, 'Emprestada'
  )
  RETURNING id INTO _loan_id;

  -- Mark owner bird as loaned out
  UPDATE public.birds
     SET loan_status = 'emprestada_saida',
         loan_id = _loan_id
   WHERE id = _bird.id;

  -- Reuse orphan clone if it exists, otherwise insert a new one
  SELECT id INTO _existing_clone FROM public.birds
   WHERE user_id = _borrower_user_id
     AND original_bird_id = _bird.id
     AND loan_status = 'emprestada_entrada'
   LIMIT 1;

  IF _existing_clone IS NOT NULL THEN
    UPDATE public.birds
       SET loan_id = _loan_id,
           nome = _bird.nome,
           nome_cientifico = _bird.nome_cientifico,
           nome_comum_especie = _bird.nome_comum_especie,
           sexo = _bird.sexo,
           data_nascimento = _bird.data_nascimento,
           tipo_anilha = _bird.tipo_anilha,
           diametro_anilha = _bird.diametro_anilha,
           codigo_anilha = _bird.codigo_anilha,
           status = _bird.status,
           foto_url = _bird.foto_url,
           fotos = _bird.fotos,
           estado = _bird.estado,
           original_owner_user_id = _caller,
           original_owner_email = _owner_email
     WHERE id = _existing_clone;
    _clone_id := _existing_clone;
  ELSE
    INSERT INTO public.birds (
      user_id, nome, nome_cientifico, nome_comum_especie,
      sexo, data_nascimento, tipo_anilha, diametro_anilha,
      codigo_anilha, status, observacoes, foto_url, fotos, estado,
      loan_status, loan_id,
      original_owner_user_id, original_owner_email, original_bird_id
    ) VALUES (
      _borrower_user_id, _bird.nome, _bird.nome_cientifico, _bird.nome_comum_especie,
      _bird.sexo, _bird.data_nascimento, _bird.tipo_anilha, _bird.diametro_anilha,
      _bird.codigo_anilha, _bird.status, _bird.observacoes, _bird.foto_url, _bird.fotos, _bird.estado,
      'emprestada_entrada', _loan_id,
      _caller, _owner_email, _bird.id
    )
    RETURNING id INTO _clone_id;
  END IF;

  UPDATE public.bird_loans
     SET borrower_bird_id = _clone_id
   WHERE id = _loan_id;

  RETURN jsonb_build_object(
    'loan_id', _loan_id,
    'borrower_bird_id', _clone_id,
    'borrower_user_id', _borrower_user_id,
    'borrower_email', _borrower_email,
    'borrower_nome_criadouro', _borrower_nome
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_loan(uuid, text, date, text) TO authenticated;
