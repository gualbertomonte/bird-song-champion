-- 1. Reabrir torneio encerrado
CREATE OR REPLACE FUNCTION public.reabrir_torneio(_torneio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _status text;
  _organizer uuid;
BEGIN
  SELECT status, organizer_user_id INTO _status, _organizer
  FROM torneios WHERE id = _torneio_id;

  IF _organizer IS NULL THEN
    RAISE EXCEPTION 'Torneio não encontrado';
  END IF;
  IF _organizer <> auth.uid() THEN
    RAISE EXCEPTION 'Apenas o organizador pode reabrir o torneio';
  END IF;
  IF _status <> 'Encerrado' THEN
    RAISE EXCEPTION 'Torneio não está encerrado';
  END IF;

  UPDATE torneios
  SET status = 'Em andamento', encerrado_em = NULL, updated_at = now()
  WHERE id = _torneio_id;

  INSERT INTO torneio_audit_log (torneio_id, acao, user_id)
  VALUES (_torneio_id, 'reabertura', auth.uid());
END;
$$;

-- 2. Limpar pontuações (todas ou por bateria)
CREATE OR REPLACE FUNCTION public.limpar_pontuacoes_torneio(_torneio_id uuid, _bateria int DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _status text;
  _organizer uuid;
  _deleted int;
BEGIN
  SELECT status, organizer_user_id INTO _status, _organizer
  FROM torneios WHERE id = _torneio_id;

  IF _organizer IS NULL THEN
    RAISE EXCEPTION 'Torneio não encontrado';
  END IF;
  IF _organizer <> auth.uid() THEN
    RAISE EXCEPTION 'Apenas o organizador pode limpar pontuações';
  END IF;
  IF _status = 'Rascunho' THEN
    RAISE EXCEPTION 'Torneio em rascunho não possui pontuações';
  END IF;

  IF _bateria IS NULL THEN
    DELETE FROM torneio_pontuacoes WHERE torneio_id = _torneio_id;
  ELSE
    DELETE FROM torneio_pontuacoes WHERE torneio_id = _torneio_id AND bateria = _bateria;
  END IF;
  GET DIAGNOSTICS _deleted = ROW_COUNT;

  IF _status = 'Encerrado' THEN
    UPDATE torneios
    SET status = 'Em andamento', encerrado_em = NULL, updated_at = now()
    WHERE id = _torneio_id;
  END IF;

  INSERT INTO torneio_audit_log (torneio_id, acao, bateria, user_id)
  VALUES (_torneio_id, 'limpeza_pontuacoes', _bateria, auth.uid());
END;
$$;

-- 3. Reset completo (mantém inscrições, zera tudo o resto)
CREATE OR REPLACE FUNCTION public.resetar_torneio(_torneio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _status text;
  _organizer uuid;
BEGIN
  SELECT status, organizer_user_id INTO _status, _organizer
  FROM torneios WHERE id = _torneio_id;

  IF _organizer IS NULL THEN
    RAISE EXCEPTION 'Torneio não encontrado';
  END IF;
  IF _organizer <> auth.uid() THEN
    RAISE EXCEPTION 'Apenas o organizador pode resetar o torneio';
  END IF;
  IF _status = 'Rascunho' THEN
    RAISE EXCEPTION 'Torneio em rascunho não pode ser resetado';
  END IF;

  DELETE FROM torneio_pontuacoes WHERE torneio_id = _torneio_id;

  UPDATE torneio_inscricoes
  SET estacao = NULL, updated_at = now()
  WHERE torneio_id = _torneio_id;

  UPDATE torneios
  SET status = 'Inscricoes', encerrado_em = NULL, updated_at = now()
  WHERE id = _torneio_id;

  INSERT INTO torneio_audit_log (torneio_id, acao, user_id)
  VALUES (_torneio_id, 'reset_completo', auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.reabrir_torneio(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.limpar_pontuacoes_torneio(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resetar_torneio(uuid) TO authenticated;