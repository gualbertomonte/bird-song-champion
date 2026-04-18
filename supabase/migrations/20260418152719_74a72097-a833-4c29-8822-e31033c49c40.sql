
-- 1. Atualiza criar_bateria: texto "evento" + link /eventos/
CREATE OR REPLACE FUNCTION public.criar_bateria(_grupo_id uuid, _nome text, _data date, _numero_estacoes integer, _regulamento text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid := auth.uid();
  _bat_id uuid;
  _grupo_nome text;
  _membro record;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_grupo_admin(_grupo_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode criar eventos';
  END IF;
  IF _nome IS NULL OR trim(_nome) = '' THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;
  IF _numero_estacoes < 1 THEN RAISE EXCEPTION 'Número de estações inválido'; END IF;

  INSERT INTO public.torneio_baterias (grupo_id, nome, data, numero_estacoes, regulamento, criado_por)
  VALUES (_grupo_id, trim(_nome), _data, _numero_estacoes, _regulamento, _caller)
  RETURNING id INTO _bat_id;

  SELECT nome INTO _grupo_nome FROM public.torneio_grupos WHERE id = _grupo_id;
  FOR _membro IN
    SELECT user_id FROM public.torneio_grupo_membros
    WHERE grupo_id = _grupo_id AND status = 'Ativo' AND user_id <> _caller
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_membro.user_id, 'bateria_criada', 'Novo evento',
      'Novo evento "' || _nome || '" criado no grupo "' || _grupo_nome || '"',
      '/grupos/' || _grupo_id || '/eventos/' || _bat_id,
      jsonb_build_object('grupo_id', _grupo_id, 'bateria_id', _bat_id));
  END LOOP;

  RETURN _bat_id;
END;
$function$;

-- 2. Atualiza aprovar_inscricao_bateria
CREATE OR REPLACE FUNCTION public.aprovar_inscricao_bateria(_inscricao_id uuid, _aprovar boolean, _motivo text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _ins public.bateria_inscricoes;
  _bat_nome text;
  _grupo_id uuid;
BEGIN
  SELECT * INTO _ins FROM public.bateria_inscricoes WHERE id = _inscricao_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;
  IF NOT public.is_bateria_admin(_ins.bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode aprovar';
  END IF;

  UPDATE public.bateria_inscricoes
    SET status = CASE WHEN _aprovar THEN 'Aprovada' ELSE 'Rejeitada' END,
        motivo_rejeicao = CASE WHEN _aprovar THEN NULL ELSE _motivo END,
        updated_at = now()
    WHERE id = _inscricao_id;

  IF _aprovar THEN
    SELECT nome, grupo_id INTO _bat_nome, _grupo_id FROM public.torneio_baterias WHERE id = _ins.bateria_id;
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_ins.membro_user_id, 'inscricao_aprovada', 'Inscrição aprovada',
      'Sua ave foi aprovada no evento "' || _bat_nome || '"',
      '/grupos/' || _grupo_id || '/eventos/' || _ins.bateria_id,
      jsonb_build_object('bateria_id', _ins.bateria_id));
  END IF;
END;
$function$;

-- 3. Atualiza encerrar_bateria
CREATE OR REPLACE FUNCTION public.encerrar_bateria(_bateria_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _bat public.torneio_baterias;
  _grupo_nome text;
  _membro record;
BEGIN
  IF NOT public.is_bateria_admin(_bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode encerrar';
  END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  UPDATE public.torneio_baterias
    SET status = 'Encerrada', encerrado_em = now(), updated_at = now()
    WHERE id = _bateria_id;

  SELECT nome INTO _grupo_nome FROM public.torneio_grupos WHERE id = _bat.grupo_id;
  FOR _membro IN
    SELECT DISTINCT membro_user_id FROM public.bateria_inscricoes
    WHERE bateria_id = _bateria_id AND status = 'Aprovada'
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_membro.membro_user_id, 'bateria_encerrada', 'Evento encerrado',
      'O evento "' || _bat.nome || '" do grupo "' || _grupo_nome || '" foi encerrado',
      '/grupos/' || _bat.grupo_id || '/eventos/' || _bateria_id,
      jsonb_build_object('bateria_id', _bateria_id));
  END LOOP;
END;
$function$;

-- 4. Nova RPC: get_participantes_evento
CREATE OR REPLACE FUNCTION public.get_participantes_evento(_bateria_id uuid)
 RETURNS TABLE(
   inscricao_id uuid,
   membro_user_id uuid,
   nome_criador text,
   codigo_criadouro text,
   email text,
   bird_id uuid,
   bird_nome text,
   codigo_anilha text,
   estacao integer,
   status text,
   convidado_pelo_admin boolean,
   classificado_final boolean,
   pontos_classif numeric,
   pontos_final numeric,
   pontos_total numeric
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    bi.id AS inscricao_id,
    bi.membro_user_id,
    COALESCE(cp.nome_criadouro, p.display_name, p.email, 'Criador') AS nome_criador,
    cp.codigo_criadouro,
    p.email,
    bi.bird_id,
    (bi.bird_snapshot->>'nome')::text AS bird_nome,
    (bi.bird_snapshot->>'codigo_anilha')::text AS codigo_anilha,
    bi.estacao,
    bi.status,
    bi.convidado_pelo_admin,
    bi.classificado_final,
    bi.pontos_classif,
    bi.pontos_final,
    COALESCE(bp.pontos, 0) AS pontos_total
  FROM public.bateria_inscricoes bi
  LEFT JOIN public.profiles p ON p.user_id = bi.membro_user_id
  LEFT JOIN public.criador_profile cp ON cp.user_id = bi.membro_user_id
  LEFT JOIN public.bateria_pontuacoes bp ON bp.inscricao_id = bi.id
  WHERE bi.bateria_id = _bateria_id
    AND (public.is_bateria_admin(_bateria_id) OR public.is_bateria_membro(_bateria_id))
  ORDER BY bi.estacao NULLS LAST, bi.created_at;
$function$;
