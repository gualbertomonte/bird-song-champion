
-- Remover policies permissivas de INSERT (anon/authenticated)
DROP POLICY IF EXISTS "page_views_insert_public" ON public.page_views;
DROP POLICY IF EXISTS "tracked_link_clicks_insert_public" ON public.tracked_link_clicks;

-- Inserts agora só via edge function (service_role bypassa RLS).
-- Mantemos sem policy de INSERT — clientes não conseguem inserir diretamente.
-- A edge function track-pageview e track-link-click farão os inserts com service role.
