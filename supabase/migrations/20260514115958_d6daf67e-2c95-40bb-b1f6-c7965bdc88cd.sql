
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS alerts_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS late_order_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS sales_drop_pct integer NOT NULL DEFAULT 30;
