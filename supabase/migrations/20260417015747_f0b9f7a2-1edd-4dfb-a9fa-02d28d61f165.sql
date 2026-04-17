-- Adiciona campos para lembretes recorrentes
ALTER TABLE public.health_records
  ADD COLUMN IF NOT EXISTS recorrencia_meses integer,
  ADD COLUMN IF NOT EXISTS aplicada_em date;

-- Índice para busca eficiente de doses pendentes
CREATE INDEX IF NOT EXISTS idx_health_records_proxima_dose
  ON public.health_records (proxima_dose)
  WHERE proxima_dose IS NOT NULL AND aplicada_em IS NULL;

-- Habilita extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;