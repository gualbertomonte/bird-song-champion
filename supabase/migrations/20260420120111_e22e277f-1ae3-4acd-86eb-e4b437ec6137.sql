INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE lower(email) = lower('plantel.pro@outlook.com.br')
ON CONFLICT (user_id, role) DO NOTHING;