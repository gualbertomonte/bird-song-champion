-- 1) Trigger para gerar código automaticamente em novos criador_profile (e em updates onde codigo_criadouro fique nulo)
DROP TRIGGER IF EXISTS trg_set_codigo_criadouro ON public.criador_profile;
CREATE TRIGGER trg_set_codigo_criadouro
BEFORE INSERT OR UPDATE ON public.criador_profile
FOR EACH ROW
EXECUTE FUNCTION public.set_codigo_criadouro();

-- 2) Backfill: gerar código para qualquer criador_profile existente sem código
UPDATE public.criador_profile
SET codigo_criadouro = public.generate_codigo_criadouro()
WHERE codigo_criadouro IS NULL OR codigo_criadouro = '';

-- 3) Garantir unicidade do código
CREATE UNIQUE INDEX IF NOT EXISTS criador_profile_codigo_criadouro_key
  ON public.criador_profile (codigo_criadouro)
  WHERE codigo_criadouro IS NOT NULL;

-- 4) Atualizar handle_new_user para garantir que TODO novo usuário recebe um criador_profile com código
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  RETURN NEW;
END;
$function$;

-- 5) Garantir que o trigger de auth está ativo (recriar por segurança)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();