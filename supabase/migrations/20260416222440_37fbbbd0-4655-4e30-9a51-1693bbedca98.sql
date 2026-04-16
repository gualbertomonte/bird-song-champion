-- ============ 1. Código do criadouro ============
ALTER TABLE public.criador_profile
  ADD COLUMN IF NOT EXISTS codigo_criadouro TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_codigo_criadouro()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  novo TEXT;
  tentativas INT := 0;
BEGIN
  LOOP
    -- 6 chars hex maiúsculos a partir de md5(random)
    novo := upper(substr(md5(random()::text || clock_timestamp()::text || tentativas::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.criador_profile WHERE codigo_criadouro = novo);
    tentativas := tentativas + 1;
    EXIT WHEN tentativas > 50;
  END LOOP;
  RETURN novo;
END;
$$ SET search_path = public;

UPDATE public.criador_profile
SET codigo_criadouro = public.generate_codigo_criadouro()
WHERE codigo_criadouro IS NULL;

CREATE OR REPLACE FUNCTION public.set_codigo_criadouro()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.codigo_criadouro IS NULL THEN
    NEW.codigo_criadouro := public.generate_codigo_criadouro();
  END IF;
  RETURN NEW;
END;
$$ SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_codigo_criadouro ON public.criador_profile;
CREATE TRIGGER trg_set_codigo_criadouro
BEFORE INSERT ON public.criador_profile
FOR EACH ROW EXECUTE FUNCTION public.set_codigo_criadouro();

-- handle_new_user também cria criador_profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.criador_profile (user_id, nome_criadouro)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'criador_profile_user_id_key') THEN
    ALTER TABLE public.criador_profile ADD CONSTRAINT criador_profile_user_id_key UNIQUE (user_id);
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated can read public criador info" ON public.criador_profile;
CREATE POLICY "Authenticated can read public criador info"
ON public.criador_profile
FOR SELECT
TO authenticated
USING (true);

-- ============ 2. Colunas de empréstimo em birds ============
ALTER TABLE public.birds
  ADD COLUMN IF NOT EXISTS loan_status TEXT NOT NULL DEFAULT 'proprio',
  ADD COLUMN IF NOT EXISTS loan_id UUID,
  ADD COLUMN IF NOT EXISTS original_owner_user_id UUID,
  ADD COLUMN IF NOT EXISTS original_owner_email TEXT,
  ADD COLUMN IF NOT EXISTS original_bird_id UUID;

-- ============ 3. Tabela bird_loans ============
CREATE TABLE IF NOT EXISTS public.bird_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bird_id UUID NOT NULL,
  bird_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_user_id UUID NOT NULL,
  owner_email TEXT,
  borrower_user_id UUID,
  borrower_email TEXT NOT NULL,
  borrower_codigo_criadouro TEXT,
  borrower_bird_id UUID,
  data_emprestimo TIMESTAMPTZ NOT NULL DEFAULT now(),
  prazo_devolucao DATE,
  data_solicitacao_devolucao TIMESTAMPTZ,
  data_devolucao TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Emprestada',
  observacoes TEXT,
  filhotes_gerados INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bird_loans_owner ON public.bird_loans(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_bird_loans_borrower ON public.bird_loans(borrower_user_id);
CREATE INDEX IF NOT EXISTS idx_bird_loans_borrower_email ON public.bird_loans(lower(borrower_email));
CREATE INDEX IF NOT EXISTS idx_bird_loans_status ON public.bird_loans(status);

ALTER TABLE public.bird_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner or borrower can view loans" ON public.bird_loans;
CREATE POLICY "Owner or borrower can view loans"
ON public.bird_loans FOR SELECT TO authenticated
USING (
  auth.uid() = owner_user_id
  OR auth.uid() = borrower_user_id
  OR lower(borrower_email) = lower(auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Owner can create loans" ON public.bird_loans;
CREATE POLICY "Owner can create loans"
ON public.bird_loans FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owner or borrower can update loans" ON public.bird_loans;
CREATE POLICY "Owner or borrower can update loans"
ON public.bird_loans FOR UPDATE TO authenticated
USING (
  auth.uid() = owner_user_id
  OR auth.uid() = borrower_user_id
  OR lower(borrower_email) = lower(auth.jwt() ->> 'email')
);

DROP TRIGGER IF EXISTS trg_bird_loans_updated_at ON public.bird_loans;
CREATE TRIGGER trg_bird_loans_updated_at
BEFORE UPDATE ON public.bird_loans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 4. Tabela notifications ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, lida) WHERE lida = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;
CREATE POLICY "Authenticated can create notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============ 5. Realtime ============
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='bird_loans';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.bird_loans; END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; END IF;
END $$;