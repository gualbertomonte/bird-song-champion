-- Trocar constraint global por constraint por usuário
DROP INDEX IF EXISTS public.birds_codigo_anilha_unique;
ALTER TABLE public.birds DROP CONSTRAINT IF EXISTS birds_codigo_anilha_unique;

CREATE UNIQUE INDEX IF NOT EXISTS birds_user_codigo_anilha_unique
  ON public.birds (user_id, lower(codigo_anilha))
  WHERE codigo_anilha IS NOT NULL AND codigo_anilha <> '';