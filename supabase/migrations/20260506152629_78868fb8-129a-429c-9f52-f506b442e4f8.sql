-- Stock per product
CREATE TABLE IF NOT EXISTS public.product_stock (
  product_id text PRIMARY KEY,
  stock integer NOT NULL DEFAULT 50,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock"
ON public.product_stock FOR SELECT
USING (true);

CREATE POLICY "Admins manage stock"
ON public.product_stock FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_product_stock_updated_at
BEFORE UPDATE ON public.product_stock
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed stock for known products
INSERT INTO public.product_stock (product_id, stock)
VALUES
  ('2', 50), ('3', 30), ('6', 25), ('8', 4), ('10', 50),
  ('11', 50), ('16', 80), ('18', 12), ('20', 40), ('21', 60),
  ('22', 35), ('23', 45), ('24', 22), ('25', 18), ('26', 70),
  ('27', 100), ('28', 30), ('29', 40), ('30', 25)
ON CONFLICT (product_id) DO NOTHING;

-- Auto-decrement stock on order creation
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    UPDATE public.product_stock
    SET stock = GREATEST(stock - (item->>'quantity')::int, 0)
    WHERE product_id = (item->>'id')::text;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON public.orders;
CREATE TRIGGER trg_decrement_stock
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_stock;