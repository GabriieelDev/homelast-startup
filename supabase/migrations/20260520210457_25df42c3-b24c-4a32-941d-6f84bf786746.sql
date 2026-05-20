-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('produtos', 'produtos', true),
  ('avatares', 'avatares', true),
  ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- PRODUTOS bucket policies (public read, admin write)
CREATE POLICY "Public read produtos"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

CREATE POLICY "Admins upload produtos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update produtos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete produtos"
ON storage.objects FOR DELETE
USING (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));

-- BANNERS bucket policies (public read, admin write)
CREATE POLICY "Public read banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins upload banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

-- AVATARES bucket policies (public read, owner-only write — folder = user id)
CREATE POLICY "Public read avatares"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatares');

CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatares' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatares' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatares' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON public.orders (courier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (active);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_order ON public.order_reviews (order_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_user ON public.user_carts (user_id);