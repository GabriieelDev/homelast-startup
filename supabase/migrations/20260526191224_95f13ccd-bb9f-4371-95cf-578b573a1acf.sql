
-- ========== CATEGORIES ==========
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT '🛒',
  color text NOT NULL DEFAULT '#1565C0',
  display_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults
INSERT INTO public.categories (name, slug, icon, color, display_order) VALUES
  ('Hortifrúti', 'hortifruti', '🥬', '#2E7D32', 1),
  ('Mercearia', 'mercearia', '🏪', '#1565C0', 2),
  ('Bebidas', 'bebidas', '🥤', '#0288D1', 3),
  ('Limpeza', 'limpeza', '🧹', '#7B1FA2', 4),
  ('Higiene', 'higiene', '🧴', '#00897B', 5);

-- ========== PRODUCTS: add category_id ==========
ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

UPDATE public.products p
  SET category_id = c.id
  FROM public.categories c
  WHERE c.slug = p.category;

CREATE INDEX idx_products_category_id ON public.products(category_id);

-- ========== NFE IMPORTS ==========
CREATE TABLE public.nfe_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_number text,
  nfe_key text,
  supplier text,
  nfe_date timestamptz,
  method text NOT NULL CHECK (method IN ('xml','qrcode')),
  imported_by uuid,
  products_count int NOT NULL DEFAULT 0,
  new_count int NOT NULL DEFAULT 0,
  updated_count int NOT NULL DEFAULT 0,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfe_imports TO authenticated;
GRANT ALL ON public.nfe_imports TO service_role;

ALTER TABLE public.nfe_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view nfe imports"
  ON public.nfe_imports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert nfe imports"
  ON public.nfe_imports FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = imported_by);
