
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pending transfers table
CREATE TABLE public.pending_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  bird_data JSONB NOT NULL,
  sender_email TEXT,
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.pending_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create transfers" ON public.pending_transfers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view their pending transfers" ON public.pending_transfers
  FOR SELECT TO authenticated 
  USING (lower(recipient_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Users can update own pending transfers" ON public.pending_transfers
  FOR UPDATE TO authenticated 
  USING (lower(recipient_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE INDEX idx_pending_transfers_email ON public.pending_transfers (lower(recipient_email)) WHERE claimed = false;
