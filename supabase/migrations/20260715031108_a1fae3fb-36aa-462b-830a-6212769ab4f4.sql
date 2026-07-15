ALTER TABLE public.products ADD COLUMN variant_group TEXT NULL;
CREATE INDEX IF NOT EXISTS idx_products_variant_group ON public.products (variant_group) WHERE variant_group IS NOT NULL;