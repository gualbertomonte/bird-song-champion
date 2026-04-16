-- Remover duplicatas existentes (mantendo a mais antiga)
DELETE FROM public.birds
WHERE id IN ('69509faa-81b7-4691-aef0-88c63d4ccbb0', 'bfee1208-fcfd-4348-9ac0-f78971afb3a0');

-- Unicidade global de codigo_anilha (somente quando preenchido)
CREATE UNIQUE INDEX IF NOT EXISTS birds_codigo_anilha_unique
  ON public.birds (lower(codigo_anilha))
  WHERE codigo_anilha IS NOT NULL AND length(trim(codigo_anilha)) > 0;

-- Histórico do remetente nas transferências
ALTER TABLE public.pending_transfers
  ADD COLUMN IF NOT EXISTS transferido_por_user_id uuid,
  ADD COLUMN IF NOT EXISTS transferido_por_email text;

-- Registrar nas aves quem transferiu
ALTER TABLE public.birds
  ADD COLUMN IF NOT EXISTS transferido_por_email text,
  ADD COLUMN IF NOT EXISTS transferido_em timestamptz;