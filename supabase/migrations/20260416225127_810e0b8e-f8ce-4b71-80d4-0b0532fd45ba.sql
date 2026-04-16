-- Substituir políticas de UPDATE/DELETE para impedir alteração de aves recebidas em empréstimo
DROP POLICY IF EXISTS birds_update_own ON public.birds;
DROP POLICY IF EXISTS birds_delete_own ON public.birds;

CREATE POLICY birds_update_own ON public.birds
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND loan_status <> 'emprestada_entrada')
  WITH CHECK (auth.uid() = user_id AND loan_status <> 'emprestada_entrada');

CREATE POLICY birds_delete_own ON public.birds
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND loan_status <> 'emprestada_entrada');

-- Permitir que o servidor (fluxo de empréstimo/devolução) ainda possa atualizar via service role -
-- service role já bypassa RLS, então as policies acima continuam compatíveis com o fluxo existente
-- (no app, o status emprestada_entrada só é definido pelo proprietário no momento do empréstimo,
-- e revertido pelo proprietário no momento da devolução).