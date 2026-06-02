GRANT SELECT (id, name, phone, address, hours, min_order, min_shipping, max_shipping, social_links, carousel_config, updated_at)
ON public.store_settings TO anon, authenticated;

GRANT UPDATE (name, phone, address, hours, min_order, min_shipping, max_shipping, social_links, carousel_config, updated_at, alerts_enabled, low_stock_threshold, late_order_minutes, sales_drop_pct)
ON public.store_settings TO authenticated;

GRANT ALL ON public.store_settings TO service_role;