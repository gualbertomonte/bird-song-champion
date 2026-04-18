-- 1. Token de convite por grupo
ALTER TABLE public.torneio_grupos
  ADD COLUMN IF NOT EXISTS convite_token uuid;

UPDATE public.torneio_grupos
   SET convite_token = gen_random_uuid()
 WHERE convite_token IS NULL;

ALTER TABLE public.torneio_grupos
  ALTER COLUMN convite_token SET NOT NULL,
  ALTER COLUMN convite_token SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS torneio_grupos_convite_token_idx
  ON public.torneio_grupos(convite_token);

-- 2. Tabela de convites por email (pessoas que podem nem ter conta)
CREATE TABLE IF NOT EXISTS public.torneio_grupo_convites_email (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.torneio_grupos(id) ON DELETE CASCADE,
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  convidado_por uuid NOT NULL,
  status text NOT NULL DEFAULT 'Pendente',
  claimed_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz
);

CREATE INDEX IF NOT EXISTS tgce_email_idx ON public.torneio_grupo_convites_email (lower(email));
CREATE INDEX IF NOT EXISTS tgce_grupo_idx ON public.torneio_grupo_convites_email (grupo_id);

ALTER TABLE public.torneio_grupo_convites_email ENABLE ROW LEVEL SECURITY;

CREATE POLICY "convites_email_admin_select" ON public.torneio_grupo_convites_email
  FOR SELECT TO authenticated
  USING (public.is_grupo_admin(grupo_id) OR lower(email) = lower(auth.jwt() ->> 'email'));

-- 3. RPC pública: dados básicos do grupo a partir do token
CREATE OR REPLACE FUNCTION public.get_grupo_convite_publico(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _g public.torneio_grupos;
  _admin_nome text;
  _total int;
BEGIN
  SELECT * INTO _g FROM public.torneio_grupos WHERE convite_token = _token;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT nome_criadouro INTO _admin_nome FROM public.criador_profile WHERE user_id = _g.admin_user_id;
  SELECT count(*) INTO _total FROM public.torneio_grupo_membros
    WHERE grupo_id = _g.id AND status = 'Ativo';
  RETURN jsonb_build_object(
    'id', _g.id,
    'nome', _g.nome,
    'descricao', _g.descricao,
    'admin_nome', coalesce(_admin_nome, 'Criador'),
    'total_membros', _total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_grupo_convite_publico(uuid) TO anon, authenticated;

-- 4. RPC: aceitar convite por token (link público)
CREATE OR REPLACE FUNCTION public.aceitar_convite_grupo_por_token(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _g public.torneio_grupos;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO _g FROM public.torneio_grupos WHERE convite_token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido'; END IF;

  IF _g.admin_user_id = _caller THEN
    RETURN jsonb_build_object('grupo_id', _g.id, 'nome', _g.nome, 'ja_membro', true);
  END IF;

  INSERT INTO public.torneio_grupo_membros (grupo_id, user_id, papel, status)
  VALUES (_g.id, _caller, 'membro', 'Ativo')
  ON CONFLICT (grupo_id, user_id) DO UPDATE SET status = 'Ativo';

  -- Marca eventuais convites por email do mesmo usuário como aceitos
  UPDATE public.torneio_grupo_convites_email
     SET status = 'Aceito', claimed_user_id = _caller, claimed_at = now()
   WHERE grupo_id = _g.id
     AND lower(email) = lower(auth.jwt() ->> 'email')
     AND status = 'Pendente';

  RETURN jsonb_build_object('grupo_id', _g.id, 'nome', _g.nome, 'ja_membro', false);
END;
$$;

-- 5. RPC: convidar por email (usuário existente OU não)
CREATE OR REPLACE FUNCTION public.convidar_por_email_grupo(_grupo_id uuid, _email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _email_norm text := lower(trim(_email));
  _existing_user uuid;
  _convite_id uuid;
  _token uuid;
  _g public.torneio_grupos;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.is_grupo_admin(_grupo_id) THEN
    RAISE EXCEPTION 'Apenas o admin pode convidar';
  END IF;
  IF _email_norm = '' OR position('@' in _email_norm) = 0 THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;

  SELECT * INTO _g FROM public.torneio_grupos WHERE id = _grupo_id;

  SELECT user_id INTO _existing_user FROM public.profiles
   WHERE lower(email) = _email_norm LIMIT 1;

  IF _existing_user IS NOT NULL THEN
    -- Usuário já tem conta: usa o fluxo normal
    IF EXISTS (SELECT 1 FROM public.torneio_grupo_membros
               WHERE grupo_id = _grupo_id AND user_id = _existing_user AND status = 'Ativo') THEN
      RAISE EXCEPTION 'Usuário já é membro';
    END IF;
    _convite_id := public.convidar_membro_grupo(_grupo_id, _existing_user);
    RETURN jsonb_build_object('tipo', 'app', 'convite_id', _convite_id, 'email', _email_norm);
  END IF;

  -- Usuário ainda não existe → cria convite por email
  INSERT INTO public.torneio_grupo_convites_email (grupo_id, email, convidado_por)
  VALUES (_grupo_id, _email_norm, _caller)
  RETURNING id, token INTO _convite_id, _token;

  RETURN jsonb_build_object(
    'tipo', 'email',
    'convite_id', _convite_id,
    'email', _email_norm,
    'token', _token,
    'grupo_token', _g.convite_token,
    'grupo_nome', _g.nome
  );
END;
$$;

-- 6. Atualiza handle_new_user para vincular convites pendentes pelo email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.criador_profile (user_id, nome_criadouro, codigo_criadouro)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    public.generate_codigo_criadouro()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET codigo_criadouro = COALESCE(public.criador_profile.codigo_criadouro, EXCLUDED.codigo_criadouro);

  -- Vincula convites por email pendentes a este novo usuário (gera notificações)
  INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, metadata)
  SELECT
    NEW.id,
    'grupo_convite',
    'Convite para grupo de torneio',
    'Você foi convidado para o grupo "' || g.nome || '"',
    '/entrar/grupo/' || g.convite_token,
    jsonb_build_object('grupo_id', g.id, 'convite_email_id', ce.id)
  FROM public.torneio_grupo_convites_email ce
  JOIN public.torneio_grupos g ON g.id = ce.grupo_id
  WHERE lower(ce.email) = lower(NEW.email) AND ce.status = 'Pendente';

  RETURN NEW;
END;
$$;