
CREATE OR REPLACE FUNCTION public.get_bateria_publica(_bateria_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bat public.torneio_baterias;
  _grupo public.torneio_grupos;
  _classificacao jsonb;
BEGIN
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT * INTO _grupo FROM public.torneio_grupos WHERE id = _bat.grupo_id;

  SELECT COALESCE(jsonb_agg(item ORDER BY (item->>'pontos')::numeric DESC, item->>'estacao'), '[]'::jsonb)
    INTO _classificacao
  FROM (
    SELECT jsonb_build_object(
      'inscricao_id', bi.id,
      'bird_nome', bi.bird_snapshot->>'nome',
      'codigo_anilha', bi.bird_snapshot->>'codigo_anilha',
      'estacao', bi.estacao,
      'pontos', COALESCE(bp.pontos, 0)
    ) AS item
    FROM public.bateria_inscricoes bi
    LEFT JOIN public.bateria_pontuacoes bp ON bp.inscricao_id = bi.id
    WHERE bi.bateria_id = _bateria_id AND bi.status = 'Aprovada'
  ) sub;

  RETURN jsonb_build_object(
    'bateria', jsonb_build_object(
      'id', _bat.id,
      'nome', _bat.nome,
      'data', _bat.data,
      'numero_estacoes', _bat.numero_estacoes,
      'status', _bat.status
    ),
    'grupo', jsonb_build_object(
      'id', _grupo.id,
      'nome', _grupo.nome
    ),
    'classificacao', _classificacao
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bateria_publica(uuid) TO anon, authenticated;
