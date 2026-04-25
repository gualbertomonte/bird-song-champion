
-- 1) Realtime para detectar novos cadastros
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 2) Tracking de visitas anônimas (page_views)
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  device_type text,
  session_id text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_path ON public.page_views(path);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anônimos podem inserir (contagem de visita pública)
CREATE POLICY "page_views_insert_public"
  ON public.page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas admin pode ler
CREATE POLICY "page_views_select_admin"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) Links rastreáveis (campanhas)
CREATE TABLE public.tracked_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  destino text NOT NULL DEFAULT '/',
  descricao text,
  total_clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

CREATE TABLE public.tracked_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.tracked_links(id) ON DELETE CASCADE,
  ip text,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracked_link_clicks_link_id_created ON public.tracked_link_clicks(link_id, created_at DESC);

ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_link_clicks ENABLE ROW LEVEL SECURITY;

-- Admin gerencia links
CREATE POLICY "tracked_links_admin_all"
  ON public.tracked_links FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

-- Leitura pública do slug -> destino (necessária para o redirect funcionar mesmo sem login)
CREATE POLICY "tracked_links_select_public"
  ON public.tracked_links FOR SELECT
  TO anon, authenticated
  USING (true);

-- Apenas admin lê os clicks detalhados
CREATE POLICY "tracked_link_clicks_select_admin"
  ON public.tracked_link_clicks FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert de clicks vem da edge function (service role bypassa RLS), mas garantimos via policy aberta para anon caso precisemos
CREATE POLICY "tracked_link_clicks_insert_public"
  ON public.tracked_link_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Função para incrementar total_clicks atomicamente
CREATE OR REPLACE FUNCTION public.increment_link_click(_slug text, _ip text, _user_agent text, _referrer text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _link_id uuid;
  _destino text;
BEGIN
  SELECT id, destino INTO _link_id, _destino
  FROM public.tracked_links
  WHERE slug = _slug;

  IF _link_id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  INSERT INTO public.tracked_link_clicks (link_id, ip, user_agent, referrer)
  VALUES (_link_id, _ip, _user_agent, _referrer);

  UPDATE public.tracked_links
  SET total_clicks = total_clicks + 1
  WHERE id = _link_id;

  RETURN jsonb_build_object('found', true, 'destino', _destino);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_link_click(text, text, text, text) TO anon, authenticated;
