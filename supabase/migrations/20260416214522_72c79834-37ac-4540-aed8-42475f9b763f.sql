ALTER TABLE public.birds REPLICA IDENTITY FULL;
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.health_records REPLICA IDENTITY FULL;
ALTER TABLE public.nests REPLICA IDENTITY FULL;
ALTER TABLE public.criador_profile REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.birds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.criador_profile;