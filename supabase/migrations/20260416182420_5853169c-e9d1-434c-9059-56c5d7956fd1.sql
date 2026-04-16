-- Drop policies that reference auth.users (causes "permission denied for table users")
DROP POLICY IF EXISTS "Authenticated users can create transfers" ON public.pending_transfers;
DROP POLICY IF EXISTS "Users can update own pending transfers" ON public.pending_transfers;
DROP POLICY IF EXISTS "Users can view their pending transfers" ON public.pending_transfers;

-- Recreate using auth.jwt() ->> 'email' which doesn't require querying auth.users
CREATE POLICY "Authenticated users can create transfers"
  ON public.pending_transfers FOR INSERT TO authenticated
  WITH CHECK (lower(sender_email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Users can view their pending transfers"
  ON public.pending_transfers FOR SELECT TO authenticated
  USING (lower(recipient_email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Users can update own pending transfers"
  ON public.pending_transfers FOR UPDATE TO authenticated
  USING (lower(recipient_email) = lower((auth.jwt() ->> 'email')));