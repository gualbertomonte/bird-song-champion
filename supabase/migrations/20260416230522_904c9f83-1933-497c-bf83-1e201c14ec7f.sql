-- Permitir que usuários autenticados leiam profiles para localizar destinatários (empréstimos/transferências)
-- Mantém policy existente "Users can view own profile". Esta policy adicional libera SELECT a authenticated.
CREATE POLICY "Authenticated can read profiles for lookup"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);