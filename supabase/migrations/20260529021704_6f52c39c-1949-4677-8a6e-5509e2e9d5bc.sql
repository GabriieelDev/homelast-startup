
-- 1. order_reviews: drop public USING:true policy, add admin view
DROP POLICY IF EXISTS "Anyone view reviews aggregate" ON public.order_reviews;
CREATE POLICY "Admins view all reviews" ON public.order_reviews
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. orders: tighten courier update + remove broad user update
DROP POLICY IF EXISTS "Couriers update assigned orders" ON public.orders;
CREATE POLICY "Couriers update assigned orders" ON public.orders
  FOR UPDATE TO public
  USING (public.has_role(auth.uid(), 'entregador'::app_role) AND courier_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'entregador'::app_role) AND courier_id = auth.uid());

DROP POLICY IF EXISTS "Couriers view available orders" ON public.orders;
CREATE POLICY "Couriers view assigned orders" ON public.orders
  FOR SELECT TO public
  USING (public.has_role(auth.uid(), 'entregador'::app_role) AND (courier_id IS NULL OR courier_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own orders" ON public.orders;

-- 3. products: hide cost_price from anon/authenticated via column grants
REVOKE SELECT (cost_price) ON public.products FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_product_costs()
RETURNS TABLE(id text, cost_price numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.cost_price
  FROM public.products p
  WHERE public.has_role(auth.uid(), 'admin'::app_role);
$$;
REVOKE EXECUTE ON FUNCTION public.get_admin_product_costs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_product_costs() TO authenticated;

-- 4. store_settings: hide internal operational columns from anon/authenticated
REVOKE SELECT (low_stock_threshold, late_order_minutes, sales_drop_pct, alerts_enabled)
  ON public.store_settings FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_store_settings()
RETURNS TABLE(
  low_stock_threshold integer,
  late_order_minutes integer,
  sales_drop_pct integer,
  alerts_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.low_stock_threshold, s.late_order_minutes, s.sales_drop_pct, s.alerts_enabled
  FROM public.store_settings s
  WHERE s.id = 'main' AND public.has_role(auth.uid(), 'admin'::app_role);
$$;
REVOKE EXECUTE ON FUNCTION public.get_admin_store_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_store_settings() TO authenticated;

-- 5. storage: drop broad public SELECT (files still load via public CDN URLs)
DROP POLICY IF EXISTS "Public read produtos" ON storage.objects;
DROP POLICY IF EXISTS "Public read banners" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatares" ON storage.objects;

-- 6. SECURITY DEFINER functions: revoke EXECUTE from clients (triggers/admin RPC only)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_product_sale_price() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_product_sales() FROM PUBLIC, anon, authenticated;
