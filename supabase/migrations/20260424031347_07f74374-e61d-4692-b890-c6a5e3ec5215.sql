-- treatment_doses: dono pode inserir/deletar seus próprios registros
CREATE POLICY "doses_insert_own"
ON public.treatment_doses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "doses_delete_own"
ON public.treatment_doses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- access_logs: defense-in-depth (gravação real é feita pela edge function via service role)
CREATE POLICY "access_logs_insert_self"
ON public.access_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "access_logs_delete_admin"
ON public.access_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- torneio_participantes: bloqueia writes diretos do cliente.
-- Operações reais acontecem via SECURITY DEFINER functions (aceitar_convite_torneio, etc)
CREATE POLICY "participantes_no_direct_insert"
ON public.torneio_participantes
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "participantes_no_direct_update"
ON public.torneio_participantes
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "participantes_no_direct_delete"
ON public.torneio_participantes
FOR DELETE
TO authenticated
USING (false);

-- torneio_audit_log: bloqueia writes diretos. Inserts vêm de funções internas.
CREATE POLICY "audit_no_direct_insert"
ON public.torneio_audit_log
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "audit_no_direct_update"
ON public.torneio_audit_log
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "audit_no_direct_delete"
ON public.torneio_audit_log
FOR DELETE
TO authenticated
USING (false);