CREATE OR REPLACE FUNCTION public.inscrever_ave_torneio(_torneio_id uuid, _bird_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF _bird.sexo <> 'M' THEN
    RAISE EXCEPTION 'Apenas machos podem participar de torneios';
  END IF;

  INSERT INTO public.torneio_inscricoes (torneio_id, participante_user_id, bird_id, bird_snapshot)
  VALUES (_torneio_id, _caller, _bird_id, to_jsonb(_bird))
  RETURNING id INTO _inscricao_id;

  RETURN _inscricao_id;
END;
$function$;