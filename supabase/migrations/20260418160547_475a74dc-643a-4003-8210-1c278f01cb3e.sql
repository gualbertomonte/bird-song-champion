CREATE OR REPLACE FUNCTION public.definir_formato_eliminatoria(_bateria_id uuid, _classif_duracao integer, _classif_corte numeric, _final_duracao integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _bat public.torneio_baterias;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_bateria_admin(_bateria_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode configurar';
  END IF;
  SELECT * INTO _bat FROM public.torneio_baterias WHERE id = _bateria_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bateria não encontrada'; END IF;
  IF _bat.status = 'Encerrada' THEN
    RAISE EXCEPTION 'Evento encerrado — configuração bloqueada';
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
         fase_atual = CASE WHEN _bat.formato = 'eliminatoria' THEN _bat.fase_atual ELSE 'classificatoria' END,
         classif_duracao_min = _classif_duracao,
         classif_corte_minimo = _classif_corte,
         final_duracao_min = _final_duracao,
         updated_at = now()
   WHERE id = _bateria_id;
END;
$function$;