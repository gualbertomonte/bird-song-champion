-- Security definer function to confirm loan return atomically
-- The borrower calls this; function bypasses RLS to update owner's bird and delete borrower's copy.
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

  -- Only the borrower can confirm
  IF _loan.borrower_user_id IS DISTINCT FROM _caller THEN
    RAISE EXCEPTION 'Apenas o recebedor pode confirmar a devolução';
  END IF;

  -- 1. Mark loan as returned
  UPDATE public.bird_loans
  SET status = 'Devolvida',
      data_devolucao = now()
  WHERE id = _loan_id;

  -- 2. Delete borrower's copy of the bird
  IF _loan.borrower_bird_id IS NOT NULL THEN
    DELETE FROM public.birds WHERE id = _loan.borrower_bird_id;
  ELSE
    DELETE FROM public.birds
    WHERE original_bird_id = _loan.bird_id
      AND user_id = _caller
      AND loan_status = 'emprestada_entrada';
  END IF;

  -- 3. Restore owner's bird status
  UPDATE public.birds
  SET loan_status = 'proprio',
      loan_id = NULL
  WHERE id = _loan.bird_id;
END;
$$;

-- Same pattern for cancel: owner cancels and we need to delete borrower's copy across RLS boundary
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

  IF _loan.borrower_bird_id IS NOT NULL THEN
    DELETE FROM public.birds WHERE id = _loan.borrower_bird_id;
  END IF;

  UPDATE public.birds
  SET loan_status = 'proprio',
      loan_id = NULL
  WHERE id = _loan.bird_id;

  UPDATE public.bird_loans
  SET status = 'Devolvida',
      data_devolucao = now()
  WHERE id = _loan_id;
END;
$$;