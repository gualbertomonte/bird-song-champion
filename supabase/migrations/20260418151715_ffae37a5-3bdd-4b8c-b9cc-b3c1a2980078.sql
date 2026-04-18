
-- 1) Novas colunas em torneio_baterias
ALTER TABLE public.torneio_baterias
  ADD COLUMN IF NOT EXISTS formato text NOT NULL DEFAULT 'simples',
  ADD COLUMN IF NOT EXISTS fase_atual text NOT NULL DEFAULT 'unica',
  ADD COLUMN IF NOT EXISTS classif_duracao_min int,
  ADD COLUMN IF NOT EXISTS classif_corte_minimo numeric,
  ADD COLUMN IF NOT EXISTS final_duracao_min int;

-- 2) Novas colunas em bateria_inscricoes
ALTER TABLE public.bateria_inscricoes
  ADD COLUMN IF NOT EXISTS convidado_pelo_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pontos_classif numeric,
  ADD COLUMN IF NOT EXISTS pontos_final numeric,
  ADD COLUMN IF NOT EXISTS classificado_final boolean NOT NULL DEFAULT false;

-- 3) RPC: definir formato eliminatória
CREATE OR REPLACE FUNCTION public.definir_formato_eliminatoria(
  _bateria_id uuid,
  _classif_duracao int,
  _classif_corte numeric,
  _final_duracao int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bat public.torneio_baterias;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_bateria_admin(_bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode configurar';
  END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bateria não encontrada'; END IF;
  IF _bat.status NOT IN ('Agendada','Inscricoes','Sorteada') THEN
    RAISE EXCEPTION 'Configuração não permitida neste status';
  END IF;
  IF _classif_duracao IS NULL OR _classif_duracao < 1 THEN
    RAISE EXCEPTION 'Duração da classificatória inválida';
  END IF;
  IF _final_duracao IS NULL OR _final_duracao < 1 THEN
    RAISE EXCEPTION 'Duração da final inválida';
  END IF;
  IF _classif_corte IS NULL OR _classif_corte < 0 THEN
    RAISE EXCEPTION 'Corte inválido';
  END IF;

  UPDATE public.torneio_baterias
     SET formato = 'eliminatoria',
         fase_atual = 'classificatoria',
         classif_duracao_min = _classif_duracao,
         classif_corte_minimo = _classif_corte,
         final_duracao_min = _final_duracao,
         updated_at = now()
   WHERE id = _bateria_id;
END;
$$;

-- 4) RPC: convidar vários membros para o evento (cria inscrições aprovadas sem ave ainda)
CREATE OR REPLACE FUNCTION public.convidar_membros_evento(
  _bateria_id uuid,
  _user_ids uuid[]
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF NOT FOUND THEN RAISE EXCEPTION 'Bateria não encontrada'; END IF;
  IF _bat.status NOT IN ('Agendada','Inscricoes') THEN
    RAISE EXCEPTION 'Convite só é possível antes do sorteio';
  END IF;

  SELECT g.nome, b.nome INTO _grupo_nome, _bat_nome
    FROM public.torneio_baterias b
    JOIN public.torneio_grupos g ON g.id = b.grupo_id
   WHERE b.id = _bateria_id;

  FOREACH _u IN ARRAY _user_ids LOOP
    -- precisa ser membro ativo do grupo
    IF NOT EXISTS (
      SELECT 1 FROM public.torneio_grupo_membros m
       WHERE m.grupo_id = _bat.grupo_id AND m.user_id = _u AND m.status = 'Ativo'
    ) THEN
      CONTINUE;
    END IF;
    -- se já existe uma inscrição daquele membro, pula
    IF EXISTS (
      SELECT 1 FROM public.bateria_inscricoes
       WHERE bateria_id = _bateria_id AND membro_user_id = _u
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.bateria_inscricoes
      (bateria_id, membro_user_id, bird_id, bird_snapshot, status, convidado_pelo_admin)
    VALUES
      (_bateria_id, _u, '00000000-0000-0000-0000-000000000000'::uuid,
       jsonb_build_object('placeholder', true),
       'Aprovada', true);
    _count := _count + 1;

    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
    VALUES (_u, 'evento_convite', 'Você foi convidado para um evento',
      'Inscreva sua ave no evento "' || _bat_nome || '" do grupo "' || _grupo_nome || '"',
      '/grupos/' || _bat.grupo_id || '/baterias/' || _bateria_id,
      jsonb_build_object('bateria_id', _bateria_id));
  END LOOP;

  RETURN _count;
END;
$$;

-- 5) RPC: aplicar corte da classificatória
CREATE OR REPLACE FUNCTION public.aplicar_corte_classificatoria(
  _bateria_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bat public.torneio_baterias;
  _classificados int;
  _eliminados int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_bateria_admin(_bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode aplicar o corte';
  END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bateria não encontrada'; END IF;
  IF _bat.formato <> 'eliminatoria' THEN
    RAISE EXCEPTION 'Evento não está em modo eliminatória';
  END IF;
  IF _bat.fase_atual <> 'classificatoria' THEN
    RAISE EXCEPTION 'Corte só é possível na fase classificatória';
  END IF;

  UPDATE public.bateria_inscricoes
     SET classificado_final = (COALESCE(pontos_classif, 0) >= COALESCE(_bat.classif_corte_minimo, 0)),
         updated_at = now()
   WHERE bateria_id = _bateria_id AND status = 'Aprovada';

  SELECT
    count(*) FILTER (WHERE classificado_final),
    count(*) FILTER (WHERE NOT classificado_final)
    INTO _classificados, _eliminados
    FROM public.bateria_inscricoes
   WHERE bateria_id = _bateria_id AND status = 'Aprovada';

  UPDATE public.torneio_baterias
     SET fase_atual = 'final', updated_at = now()
   WHERE id = _bateria_id;

  RETURN jsonb_build_object('classificados', _classificados, 'eliminados', _eliminados);
END;
$$;

-- 6) RPC: registrar pontuação por fase
CREATE OR REPLACE FUNCTION public.registrar_pontuacao_fase(
  _inscricao_id uuid,
  _pontos numeric,
  _fase text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _ins public.bateria_inscricoes;
  _bat public.torneio_baterias;
  _total numeric;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF _fase NOT IN ('classificatoria','final','unica') THEN
    RAISE EXCEPTION 'Fase inválida';
  END IF;

  SELECT * INTO _ins FROM public.bateria_inscricoes WHERE id = _inscricao_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _ins.bateria_id;

  IF NOT public.is_bateria_admin(_ins.bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode lançar pontuação';
  END IF;
  IF _bat.status = 'Encerrada' THEN
    RAISE EXCEPTION 'Bateria encerrada — pontuação bloqueada';
  END IF;
  IF _ins.status <> 'Aprovada' THEN RAISE EXCEPTION 'Inscrição não aprovada'; END IF;

  IF _fase = 'classificatoria' THEN
    UPDATE public.bateria_inscricoes
       SET pontos_classif = _pontos, updated_at = now()
     WHERE id = _inscricao_id;
  ELSIF _fase = 'final' THEN
    IF _bat.formato = 'eliminatoria' AND NOT _ins.classificado_final THEN
      RAISE EXCEPTION 'Esta ave não está classificada para a final';
    END IF;
    UPDATE public.bateria_inscricoes
       SET pontos_final = _pontos, updated_at = now()
     WHERE id = _inscricao_id;
  END IF;

  -- Recalcula total para a tabela bateria_pontuacoes (mantém ranking acumulado)
  IF _fase = 'unica' THEN
    _total := _pontos;
  ELSE
    SELECT COALESCE(pontos_classif, 0) + COALESCE(pontos_final, 0)
      INTO _total
      FROM public.bateria_inscricoes WHERE id = _inscricao_id;
  END IF;

  INSERT INTO public.bateria_pontuacoes (bateria_id, inscricao_id, pontos, registrado_por)
  VALUES (_ins.bateria_id, _inscricao_id, _total, _caller)
  ON CONFLICT (inscricao_id) DO UPDATE
    SET pontos = EXCLUDED.pontos, updated_at = now(), registrado_por = _caller;

  IF _bat.status = 'Sorteada' THEN
    UPDATE public.torneio_baterias SET status = 'Em andamento', updated_at = now()
     WHERE id = _ins.bateria_id;
  END IF;
END;
$$;
