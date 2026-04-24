
-- Allow senders to view their own sent transfers
CREATE POLICY "Senders can view their sent transfers"
ON public.pending_transfers
FOR SELECT
TO authenticated
USING (
  transferido_por_user_id = auth.uid()
  OR lower(coalesce(sender_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Remove broad public SELECT on bird-photos (public bucket still serves files
-- via getPublicUrl without a SELECT policy). Restrict listing to owner folder.
DROP POLICY IF EXISTS "bird-photos public read" ON storage.objects;

CREATE POLICY "bird-photos owner can read own folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'bird-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
