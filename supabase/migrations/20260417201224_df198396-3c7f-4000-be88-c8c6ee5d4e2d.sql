
DROP VIEW IF EXISTS public.ranking_acumulado_grupo;

CREATE OR REPLACE FUNCTION public.get_ranking_acumulado_grupo(_grupo_id uuid)
RETURNS TABLE (
  grupo_id uuid,
  membro_user_id uuid,
  bird_id uuid,
  bird_nome text,
  codigo_anilha text,
  baterias_disputadas bigint,
  total_pontos numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.grupo_id,
    bi.membro_user_id,
    bi.bird_id,
    (bi.bird_snapshot->>'nome')::text AS bird_nome,
    (bi.bird_snapshot->>'codigo_anilha')::text AS codigo_anilha,
    COUNT(DISTINCT b.id) AS baterias_disputadas,
    COALESCE(SUM(bp.pontos), 0) AS total_pontos
  FROM public.bateria_inscricoes bi
  JOIN public.torneio_baterias b ON b.id = bi.bateria_id
  LEFT JOIN public.bateria_pontuacoes bp ON bp.inscricao_id = bi.id
  WHERE b.grupo_id = _grupo_id
    AND b.status = 'Encerrada'
    AND bi.status = 'Aprovada'
    AND (public.is_grupo_admin(_grupo_id) OR public.is_grupo_membro(_grupo_id))
  GROUP BY b.grupo_id, bi.membro_user_id, bi.bird_id, bi.bird_snapshot
  ORDER BY total_pontos DESC;
$$;
