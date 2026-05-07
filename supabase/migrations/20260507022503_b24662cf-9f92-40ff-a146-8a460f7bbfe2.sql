CREATE TABLE public.disabled_products (
  product_id text PRIMARY KEY,
  disabled_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.disabled_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view disabled products"
ON public.disabled_products FOR SELECT
USING (true);

CREATE POLICY "Admins manage disabled products"
ON public.disabled_products FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));