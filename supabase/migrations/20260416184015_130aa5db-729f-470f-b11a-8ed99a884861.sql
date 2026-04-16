
-- Trigger function for updated_at (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ BIRDS ============
CREATE TABLE public.birds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  nome_cientifico TEXT NOT NULL DEFAULT '',
  nome_comum_especie TEXT,
  sexo TEXT NOT NULL DEFAULT 'I',
  data_nascimento DATE,
  tipo_anilha TEXT,
  diametro_anilha TEXT,
  codigo_anilha TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Ativo',
  observacoes TEXT,
  pai_id UUID,
  mae_id UUID,
  foto_url TEXT,
  fotos JSONB DEFAULT '[]'::jsonb,
  estado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_birds_user ON public.birds(user_id);
ALTER TABLE public.birds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "birds_select_own" ON public.birds FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "birds_insert_own" ON public.birds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "birds_update_own" ON public.birds FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "birds_delete_own" ON public.birds FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER birds_set_updated_at BEFORE UPDATE ON public.birds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TOURNAMENTS ============
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bird_id UUID NOT NULL,
  data DATE NOT NULL,
  nome_torneio TEXT NOT NULL DEFAULT '',
  clube TEXT,
  pontuacao NUMERIC NOT NULL DEFAULT 0,
  classificacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tournaments_user ON public.tournaments(user_id);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments_select_own" ON public.tournaments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tournaments_insert_own" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tournaments_update_own" ON public.tournaments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tournaments_delete_own" ON public.tournaments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ HEALTH RECORDS ============
CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bird_id UUID NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT '',
  descricao TEXT,
  proxima_dose DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_health_user ON public.health_records(user_id);
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_select_own" ON public.health_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "health_insert_own" ON public.health_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "health_update_own" ON public.health_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "health_delete_own" ON public.health_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ NESTS ============
CREATE TABLE public.nests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  femea_id UUID NOT NULL,
  macho_id UUID NOT NULL,
  data_postura DATE NOT NULL,
  data_eclosao DATE,
  quantidade_ovos INTEGER NOT NULL DEFAULT 0,
  quantidade_filhotes INTEGER,
  status TEXT NOT NULL DEFAULT 'Incubando',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nests_user ON public.nests(user_id);
ALTER TABLE public.nests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nests_select_own" ON public.nests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "nests_insert_own" ON public.nests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nests_update_own" ON public.nests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "nests_delete_own" ON public.nests FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ CRIADOR PROFILE ============
CREATE TABLE public.criador_profile (
  user_id UUID PRIMARY KEY,
  nome_criadouro TEXT NOT NULL DEFAULT '',
  cpf TEXT,
  registro_ctf TEXT,
  validade_ctf DATE,
  endereco TEXT,
  telefone TEXT,
  logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.criador_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "criador_select_own" ON public.criador_profile FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "criador_insert_own" ON public.criador_profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "criador_update_own" ON public.criador_profile FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER criador_set_updated_at BEFORE UPDATE ON public.criador_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('bird-photos', 'bird-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "bird-photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bird-photos');

CREATE POLICY "bird-photos upload own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bird-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "bird-photos update own folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'bird-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "bird-photos delete own folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bird-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
