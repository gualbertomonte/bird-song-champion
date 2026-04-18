ALTER TABLE public.bateria_inscricoes
  DROP CONSTRAINT IF EXISTS bateria_inscricoes_status_check;

ALTER TABLE public.bateria_inscricoes
  ADD CONSTRAINT bateria_inscricoes_status_check
  CHECK (status IN ('Pendente','PendenteAve','Aprovada','Rejeitada'));