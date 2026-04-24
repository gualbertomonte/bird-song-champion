-- Remove o policy aberto que expunha todos os emails
DROP POLICY IF EXISTS "Authenticated can read profiles for lookup" ON public.profiles;

-- Função security definer para verificar se há relação legítima entre dois usuários
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- self
    _viewer = _target
    -- admin
    OR public.has_role(_viewer, 'admin')
    -- amizade aceita (em qualquer direção)
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'Aceito'
        AND ((f.requester_user_id = _viewer AND f.addressee_user_id = _target)
          OR (f.addressee_user_id = _viewer AND f.requester_user_id = _target))
    )
    -- mesmo grupo de torneio (ambos membros ativos, ou um é admin do grupo)
    OR EXISTS (
      SELECT 1
      FROM public.torneio_grupo_membros m1
      JOIN public.torneio_grupo_membros m2 ON m2.grupo_id = m1.grupo_id
      WHERE m1.user_id = _viewer
        AND m2.user_id = _target
        AND m1.status = 'Ativo'
        AND m2.status = 'Ativo'
    )
    OR EXISTS (
      SELECT 1
      FROM public.torneio_grupos g
      JOIN public.torneio_grupo_membros m ON m.grupo_id = g.id AND m.status = 'Ativo'
      WHERE (g.admin_user_id = _viewer AND m.user_id = _target)
         OR (g.admin_user_id = _target AND m.user_id = _viewer)
    )
    -- mesmo torneio
    OR EXISTS (
      SELECT 1
      FROM public.torneio_participantes p1
      JOIN public.torneio_participantes p2 ON p2.torneio_id = p1.torneio_id
      WHERE p1.user_id = _viewer AND p2.user_id = _target
    )
    OR EXISTS (
      SELECT 1
      FROM public.torneios t
      JOIN public.torneio_participantes p ON p.torneio_id = t.id
      WHERE (t.organizer_user_id = _viewer AND p.user_id = _target)
         OR (t.organizer_user_id = _target AND p.user_id = _viewer)
    )
    -- empréstimos em comum
    OR EXISTS (
      SELECT 1 FROM public.bird_loans bl
      WHERE (bl.owner_user_id = _viewer AND bl.borrower_user_id = _target)
         OR (bl.borrower_user_id = _viewer AND bl.owner_user_id = _target)
    )
$$;

-- Novo policy restrito: usuário vê o próprio perfil OU perfis com relação legítima
CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.can_view_profile(auth.uid(), user_id)
);