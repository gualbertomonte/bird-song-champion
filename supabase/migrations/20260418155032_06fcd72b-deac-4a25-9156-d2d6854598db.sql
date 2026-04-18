CREATE OR REPLACE FUNCTION public.inscrever_ave_bateria(_bateria_id uuid, _bird_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid := auth.uid();
  _bat public.torneio_baterias;
  _bird public.birds;
  _ins_id uuid;
  _grupo public.torneio_grupos;
  _solicitante_nome text;
  _admin record;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Evento não encontrado'; END IF;
  IF _bat.status = 'Encerrada' THEN
    RAISE EXCEPTION 'Evento encerrado';
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

  SELECT * INTO _grupo FROM public.torneio_grupos WHERE id = _bat.grupo_id;
  SELECT nome_criadouro INTO _solicitante_nome FROM public.criador_profile WHERE user_id = _caller;

  IF _grupo.admin_user_id <> _caller THEN
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_grupo.admin_user_id, 'evento_pedido', 'Pedido de participação',
      coalesce(_solicitante_nome,'Um criador') || ' pediu para participar do evento "' || _bat.nome || '"',
      '/grupos/' || _bat.grupo_id || '/eventos/' || _bateria_id,
      jsonb_build_object('bateria_id', _bateria_id, 'inscricao_id', _ins_id));
  END IF;

  FOR _admin IN
    SELECT user_id FROM public.torneio_grupo_membros
    WHERE grupo_id = _bat.grupo_id AND status = 'Ativo' AND papel = 'admin'
      AND user_id <> _caller AND user_id <> _grupo.admin_user_id
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_admin.user_id, 'evento_pedido', 'Pedido de participação',
      coalesce(_solicitante_nome,'Um criador') || ' pediu para participar do evento "' || _bat.nome || '"',
      '/grupos/' || _bat.grupo_id || '/eventos/' || _bateria_id,
      jsonb_build_object('bateria_id', _bateria_id, 'inscricao_id', _ins_id));
  END LOOP;

  RETURN _ins_id;
END;
$function$;