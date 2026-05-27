
-- 1. Add promotion columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS on_sale boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price numeric,
  ADD COLUMN IF NOT EXISTS sale_start timestamptz,
  ADD COLUMN IF NOT EXISTS sale_end timestamptz,
  ADD COLUMN IF NOT EXISTS sale_label text;

-- 2. Trigger to compute sale_price + validate dates
CREATE OR REPLACE FUNCTION public.compute_product_sale_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.discount_type NOT IN ('percentage', 'fixed') THEN
    NEW.discount_type := 'percentage';
  END IF;

  IF NEW.on_sale AND NEW.discount_value > 0 THEN
    IF NEW.discount_type = 'percentage' THEN
      NEW.sale_price := GREATEST(ROUND((NEW.price * (1 - LEAST(NEW.discount_value, 100) / 100))::numeric, 2), 0);
    ELSE
      NEW.sale_price := GREATEST(ROUND((NEW.price - NEW.discount_value)::numeric, 2), 0);
    END IF;
  ELSE
    NEW.sale_price := NULL;
  END IF;

  IF NEW.sale_start IS NOT NULL AND NEW.sale_end IS NOT NULL AND NEW.sale_end <= NEW.sale_start THEN
    RAISE EXCEPTION 'sale_end must be after sale_start';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_product_sale_price ON public.products;
CREATE TRIGGER trg_compute_product_sale_price
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.compute_product_sale_price();

-- 3. Sale expirations log
CREATE TABLE IF NOT EXISTS public.sale_expirations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_name text,
  sale_label text,
  expired_at timestamptz NOT NULL DEFAULT now(),
  acknowledged boolean NOT NULL DEFAULT false
);

GRANT SELECT, UPDATE ON public.sale_expirations_log TO authenticated;
GRANT ALL ON public.sale_expirations_log TO service_role;

ALTER TABLE public.sale_expirations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view sale expirations"
ON public.sale_expirations_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update sale expirations"
ON public.sale_expirations_log FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Auto-expire function
CREATE OR REPLACE FUNCTION public.expire_product_sales()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sale_expirations_log (product_id, product_name, sale_label)
  SELECT id, name, sale_label
  FROM public.products
  WHERE on_sale = true
    AND sale_end IS NOT NULL
    AND sale_end < now();

  UPDATE public.products
  SET on_sale = false
  WHERE on_sale = true
    AND sale_end IS NOT NULL
    AND sale_end < now();
END;
$$;

-- 5. Schedule via pg_cron (every 5 minutes)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-product-sales') THEN
    PERFORM cron.unschedule('expire-product-sales');
  END IF;
  PERFORM cron.schedule('expire-product-sales', '*/5 * * * *', $cron$SELECT public.expire_product_sales();$cron$);
END $$;
