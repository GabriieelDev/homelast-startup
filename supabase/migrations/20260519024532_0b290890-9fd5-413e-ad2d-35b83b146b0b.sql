
-- 1) Social links on store_settings
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Persistent cart per user
CREATE TABLE IF NOT EXISTS public.user_carts (
  user_id uuid PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cart" ON public.user_carts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cart" ON public.user_carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cart" ON public.user_carts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cart" ON public.user_carts
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER user_carts_updated_at
  BEFORE UPDATE ON public.user_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_carts;
ALTER TABLE public.user_carts REPLICA IDENTITY FULL;
