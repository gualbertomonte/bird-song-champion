-- Idempotent confirm_loan_return: always restores owner bird + cleans borrower clones
CREATE OR REPLACE FUNCTION public.confirm_loan_return(_loan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _loan public.bird_loans;
  _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _loan FROM public.bird_loans WHERE id = _loan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empréstimo não encontrado';
  END IF;

  -- Only the borrower (or owner as fallback) can confirm
  IF _loan.borrower_user_id IS DISTINCT FROM _caller
     AND _loan.owner_user_id IS DISTINCT FROM _caller THEN
    RAISE EXCEPTION 'Apenas o recebedor pode confirmar a devolução';
  END IF;

  -- 1. Mark loan as returned (idempotent)
  IF _loan.status <> 'Devolvida' THEN
    UPDATE public.bird_loans
    SET status = 'Devolvida',
        data_devolucao = now()
    WHERE id = _loan_id;
  END IF;

  -- 2. Delete borrower's copy/copies (by id and by original_bird_id fallback)
  IF _loan.borrower_bird_id IS NOT NULL THEN
    DELETE FROM public.birds WHERE id = _loan.borrower_bird_id;
  END IF;

  DELETE FROM public.birds
  WHERE original_bird_id = _loan.bird_id
    AND loan_status = 'emprestada_entrada';

  -- 3. Always restore owner's bird status
  UPDATE public.birds
  SET loan_status = 'proprio',
      loan_id = NULL
  WHERE id = _loan.bird_id;
END;
$$;

-- Idempotent cancel_loan
CREATE OR REPLACE FUNCTION public.cancel_loan(_loan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _loan public.bird_loans;
  _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _loan FROM public.bird_loans WHERE id = _loan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empréstimo não encontrado';
  END IF;

  IF _loan.owner_user_id IS DISTINCT FROM _caller THEN
    RAISE EXCEPTION 'Apenas o dono pode cancelar o empréstimo';
  END IF;

  -- Delete borrower clones (by id + by original_bird_id)
  IF _loan.borrower_bird_id IS NOT NULL THEN
    DELETE FROM public.birds WHERE id = _loan.borrower_bird_id;
  END IF;

  DELETE FROM public.birds
  WHERE original_bird_id = _loan.bird_id
    AND loan_status = 'emprestada_entrada';

  -- Always restore owner bird
  UPDATE public.birds
  SET loan_status = 'proprio',
      loan_id = NULL
  WHERE id = _loan.bird_id;

  -- Mark loan returned (idempotent)
  IF _loan.status <> 'Devolvida' THEN
    UPDATE public.bird_loans
    SET status = 'Devolvida',
        data_devolucao = now()
    WHERE id = _loan_id;
  END IF;
END;
$$;

-- Defense-in-depth trigger: any time a loan moves to Devolvida, ensure cleanup
CREATE OR REPLACE FUNCTION public.ensure_loan_return_cleanup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Devolvida' AND (OLD.status IS DISTINCT FROM 'Devolvida' OR OLD.status = 'Devolvida') THEN
    -- Delete borrower copies
    IF NEW.borrower_bird_id IS NOT NULL THEN
      DELETE FROM public.birds WHERE id = NEW.borrower_bird_id;
    END IF;

    DELETE FROM public.birds
    WHERE original_bird_id = NEW.bird_id
      AND loan_status = 'emprestada_entrada';

    -- Restore owner bird
    UPDATE public.birds
    SET loan_status = 'proprio',
        loan_id = NULL
    WHERE id = NEW.bird_id
      AND loan_status <> 'proprio';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_loan_return_cleanup ON public.bird_loans;
CREATE TRIGGER trg_ensure_loan_return_cleanup
AFTER UPDATE OF status ON public.bird_loans
FOR EACH ROW
EXECUTE FUNCTION public.ensure_loan_return_cleanup();