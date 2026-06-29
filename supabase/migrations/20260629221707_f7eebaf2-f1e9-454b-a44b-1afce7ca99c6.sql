
CREATE TABLE public.announcement_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  type text NOT NULL CHECK (type IN ('cupom', 'promocao')),
  code text,
  link_url text,
  title text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcement_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcement_banners TO authenticated;
GRANT ALL ON public.announcement_banners TO service_role;

ALTER TABLE public.announcement_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON public.announcement_banners FOR SELECT
  USING (active = true OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can insert banners"
  ON public.announcement_banners FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update banners"
  ON public.announcement_banners FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete banners"
  ON public.announcement_banners FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE TRIGGER update_announcement_banners_updated_at
  BEFORE UPDATE ON public.announcement_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
