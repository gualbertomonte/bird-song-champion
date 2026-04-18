CREATE OR REPLACE FUNCTION public.convidar_membros_evento_pendente(_bateria_id uuid, _user_ids uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _bat public.torneio_baterias;
  _u uuid;
  _count int := 0;
  _bat_nome text;
  _grupo_nome text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_bateria_admin(_bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode convidar';
  END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Evento não encontrado'; END IF;
  IF _bat.status = 'Encerrada' THEN
    RAISE EXCEPTION 'Evento encerrado — não é possível adicionar participantes';
  END IF;

  SELECT g.nome, b.nome INTO _grupo_nome, _bat_nome
    FROM public.torneio_baterias b
    JOIN public.torneio_grupos g ON g.id = b.grupo_id
   WHERE b.id = _bateria_id;

  FOREACH _u IN ARRAY _user_ids LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.torneio_grupo_membros m
       WHERE m.grupo_id = _bat.grupo_id AND m.user_id = _u AND m.status = 'Ativo'
    ) THEN
      CONTINUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.bateria_inscricoes
       WHERE bateria_id = _bateria_id AND membro_user_id = _u
         AND status IN ('PendenteAve','Pendente','Aprovada')
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.bateria_inscricoes
      (bateria_id, membro_user_id, bird_id, bird_snapshot, status, convidado_pelo_admin)
    VALUES
      (_bateria_id, _u, NULL, '{}'::jsonb, 'PendenteAve', true);
    _count := _count + 1;

    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_u, 'evento_convite', 'Você foi adicionado a um evento',
      'Escolha sua ave para participar do evento "' || _bat_nome || '" do grupo "' || _grupo_nome || '"',
      '/grupos/' || _bat.grupo_id || '/eventos/' || _bateria_id,
      jsonb_build_object('bateria_id', _bateria_id));
  END LOOP;

  RETURN _count;
END;
$function$;