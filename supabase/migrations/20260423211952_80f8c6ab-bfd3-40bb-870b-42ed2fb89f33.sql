-- Fix: Restrict notifications INSERT to own user only
DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;

CREATE POLICY "Users insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix: Remove blanket public read on criador_profile (exposes CPF, phone, address, CTF)
-- Keep the owner-only SELECT policy already in place ("criador_select_own")
DROP POLICY IF EXISTS "Authenticated can read public criador info" ON public.criador_profile;