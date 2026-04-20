-- Trigger to notify admin via edge function on new profile (signup)
CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users integer;
  payload jsonb;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.profiles;

  payload := jsonb_build_object(
    'newUserEmail', NEW.email,
    'newUserName', COALESCE(NEW.display_name, ''),
    'signupAt', NEW.created_at,
    'totalUsers', total_users
  );

  PERFORM net.http_post(
    url := 'https://hkbkksfbcfjujpigorzg.supabase.co/functions/v1/notify-admin-new-signup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrYmtrc2ZiY2ZqdWpwaWdvcnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDQ5NDgsImV4cCI6MjA5MTkyMDk0OH0.8OEC05psV-qXYCu24KnjENO-Okpemx6FJSFCsezhOVU'
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup if notification fails
  RAISE WARNING 'notify_admin_new_signup failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_profile_notify_admin ON public.profiles;
CREATE TRIGGER on_new_profile_notify_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_signup();