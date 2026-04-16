
DROP POLICY "Authenticated users can create transfers" ON public.pending_transfers;

CREATE POLICY "Authenticated users can create transfers" ON public.pending_transfers
  FOR INSERT TO authenticated 
  WITH CHECK (lower(sender_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));
