-- 1) Realtime: bloquear subscrição em canais não autorizados
-- Habilita RLS na tabela realtime.messages e exige autenticação
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas se existirem
DROP POLICY IF EXISTS "Authenticated can receive broadcast" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can send broadcast" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can listen postgres_changes" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can listen presence" ON realtime.messages;

-- Apenas usuários autenticados podem receber/enviar mensagens em canais Realtime
CREATE POLICY "Authenticated can receive broadcast"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can send broadcast"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2) weekly_reports: bloquear escritas vindas do cliente (apenas service_role/SECURITY DEFINER)
DROP POLICY IF EXISTS weekly_reports_no_client_insert ON public.weekly_reports;
DROP POLICY IF EXISTS weekly_reports_no_client_update ON public.weekly_reports;
DROP POLICY IF EXISTS weekly_reports_no_client_delete ON public.weekly_reports;

CREATE POLICY weekly_reports_no_client_insert
ON public.weekly_reports
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY weekly_reports_no_client_update
ON public.weekly_reports
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY weekly_reports_no_client_delete
ON public.weekly_reports
FOR DELETE
TO authenticated
USING (false);

-- 3) torneio_grupo_membros: bloquear escritas vindas do cliente
DROP POLICY IF EXISTS membros_no_client_insert ON public.torneio_grupo_membros;
DROP POLICY IF EXISTS membros_no_client_update ON public.torneio_grupo_membros;
DROP POLICY IF EXISTS membros_no_client_delete ON public.torneio_grupo_membros;

CREATE POLICY membros_no_client_insert
ON public.torneio_grupo_membros
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY membros_no_client_update
ON public.torneio_grupo_membros
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY membros_no_client_delete
ON public.torneio_grupo_membros
FOR DELETE
TO authenticated
USING (false);