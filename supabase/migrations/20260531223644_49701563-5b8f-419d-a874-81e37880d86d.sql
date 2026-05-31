
-- 1. Restrict couriers to only orders explicitly assigned to them
DROP POLICY IF EXISTS "Couriers view assigned orders" ON public.orders;
CREATE POLICY "Couriers view assigned orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'entregador'::app_role) AND courier_id = auth.uid());

-- 2. Hide products.cost_price from anon/authenticated (admins use get_admin_product_costs RPC)
REVOKE SELECT (cost_price) ON public.products FROM anon, authenticated, PUBLIC;

-- 3. Hide internal operational thresholds in store_settings from anon/authenticated
REVOKE SELECT (low_stock_threshold, late_order_minutes, sales_drop_pct, alerts_enabled)
  ON public.store_settings FROM anon, authenticated, PUBLIC;

-- 4. Lock down SECURITY DEFINER functions: revoke EXECUTE from public/anon
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_product_sale_price() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_product_sales() FROM PUBLIC, anon, authenticated;

-- has_role must remain callable by authenticated users (used in RLS evaluation paths and client checks)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Admin RPCs: restrict to authenticated only (function body already checks has_role admin)
REVOKE EXECUTE ON FUNCTION public.get_admin_product_costs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_product_costs() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_admin_store_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_store_settings() TO authenticated;
