-- Item 2: bird_id pode ser nulo (inscrição pendente de ave)
ALTER TABLE public.bateria_inscricoes ALTER COLUMN bird_id DROP NOT NULL;

-- Item 4: is_grupo_admin agora aceita co-admins via papel='admin' nos membros
CREATE OR REPLACE FUNCTION public.is_grupo_admin(_grupo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.torneio_grupos
    WHERE id = _grupo_id AND admin_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.torneio_grupo_membros
    WHERE grupo_id = _grupo_id
      AND user_id = auth.uid()
      AND status = 'Ativo'
      AND papel = 'admin'
  );
$$;

-- Promover membro a admin
CREATE OR REPLACE FUNCTION public.promover_membro_admin(_grupo_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _grupo_nome text;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_grupo_admin(_grupo_id) THEN
    RAISE EXCEPTION 'Apenas admins podem promover';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.torneio_grupo_membros
                 WHERE grupo_id = _grupo_id AND user_id = _user_id AND status = 'Ativo') THEN
    RAISE EXCEPTION 'Usuário não é membro ativo';
  END IF;

  UPDATE public.torneio_grupo_membros
     SET papel = 'admin'
   WHERE grupo_id = _grupo_id AND user_id = _user_id;

  SELECT nome INTO _grupo_nome FROM public.torneio_grupos WHERE id = _grupo_id;
  INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
  VALUES (_user_id, 'grupo_admin_promovido', 'Você é admin agora',
    'Você foi promovido a admin do grupo "' || _grupo_nome || '"',
    '/grupos/' || _grupo_id,
    jsonb_build_object('grupo_id', _grupo_id));
END;
$$;

-- Rebaixar admin (só super admin original)
CREATE OR REPLACE FUNCTION public.rebaixar_membro_admin(_grupo_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _g public.torneio_grupos;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _g FROM public.torneio_grupos WHERE id = _grupo_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Grupo não encontrado'; END IF;
  IF _g.admin_user_id <> _caller THEN
    RAISE EXCEPTION 'Apenas o admin principal pode rebaixar';
  END IF;
  IF _user_id = _g.admin_user_id THEN
    RAISE EXCEPTION 'Admin principal não pode ser rebaixado';
  END IF;

  UPDATE public.torneio_grupo_membros
     SET papel = 'membro'
   WHERE grupo_id = _grupo_id AND user_id = _user_id;
END;
$$;

-- Item 2: convidar membros para evento (sem ave, status PendenteAve)
CREATE OR REPLACE FUNCTION public.convidar_membros_evento_pendente(_bateria_id uuid, _user_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _bat public.torneio_baterias;
  _grupo_nome text;
  _uid uuid;
  _count int := 0;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Evento não encontrado'; END IF;
  IF NOT public.is_bateria_admin(_bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode convidar';
  END IF;

  SELECT nome INTO _grupo_nome FROM public.torneio_grupos WHERE id = _bat.grupo_id;

  FOREACH _uid IN ARRAY _user_ids LOOP
    -- Não duplica se já tem inscrição ativa nesse evento
    IF NOT EXISTS (SELECT 1 FROM public.bateria_inscricoes
                   WHERE bateria_id = _bateria_id AND membro_user_id = _uid
                     AND status IN ('PendenteAve','Pendente','Aprovada')) THEN
      INSERT INTO public.bateria_inscricoes
        (bateria_id, membro_user_id, bird_id, bird_snapshot, status, convidado_pelo_admin)
      VALUES (_bateria_id, _uid, NULL, '{}'::jsonb, 'PendenteAve', true);

      INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
      VALUES (_uid, 'evento_convite', 'Você foi adicionado a um evento',
        'Você foi convidado para o evento "' || _bat.nome || '" no grupo "' || _grupo_nome || '". Escolha sua ave para confirmar.',
        '/grupos/' || _bat.grupo_id || '/eventos/' || _bateria_id,
        jsonb_build_object('bateria_id', _bateria_id, 'grupo_id', _bat.grupo_id));
      _count := _count + 1;
    END IF;
  END LOOP;

  RETURN _count;
END;
$$;

-- Item 2: convidado escolhe ave (vai direto pra Aprovada — admin já convidou)
CREATE OR REPLACE FUNCTION public.escolher_ave_inscricao(_inscricao_id uuid, _bird_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _ins public.bateria_inscricoes;
  _bird public.birds;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _ins FROM public.bateria_inscricoes WHERE id = _inscricao_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;
  IF _ins.membro_user_id <> _caller THEN RAISE EXCEPTION 'Apenas o convidado pode escolher a ave'; END IF;
  IF _ins.status <> 'PendenteAve' THEN RAISE EXCEPTION 'Inscrição não está aguardando ave'; END IF;

  SELECT * INTO _bird FROM public.birds WHERE id = _bird_id;
  IF NOT FOUND OR _bird.user_id <> _caller THEN RAISE EXCEPTION 'Ave inválida'; END IF;
  IF _bird.sexo <> 'M' THEN RAISE EXCEPTION 'Apenas machos podem participar'; END IF;

  UPDATE public.bateria_inscricoes
     SET bird_id = _bird_id,
         bird_snapshot = to_jsonb(_bird),
         status = CASE WHEN _ins.convidado_pelo_admin THEN 'Aprovada' ELSE 'Pendente' END,
         updated_at = now()
   WHERE id = _inscricao_id;
END;
$$;

-- Item 3: notificar admins quando alguém pede para participar
CREATE OR REPLACE FUNCTION public.inscrever_ave_bateria(_bateria_id uuid, _bird_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  IF _bat.status NOT IN ('Agendada','Inscricoes') THEN
    RAISE EXCEPTION 'Inscrições encerradas';
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

  -- Notifica admins do grupo
  SELECT * INTO _grupo FROM public.torneio_grupos WHERE id = _bat.grupo_id;
  SELECT nome_criadouro INTO _solicitante_nome FROM public.criador_profile WHERE user_id = _caller;

  -- super admin
  IF _grupo.admin_user_id <> _caller THEN
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_grupo.admin_user_id, 'evento_pedido', 'Pedido de participação',
      coalesce(_solicitante_nome,'Um criador') || ' pediu para participar do evento "' || _bat.nome || '"',
      '/grupos/' || _bat.grupo_id || '/eventos/' || _bateria_id,
      jsonb_build_object('bateria_id', _bateria_id, 'inscricao_id', _ins_id));
  END IF;

  -- co-admins
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
$$;