CREATE TABLE public.user_redeemed_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, coupon_id)
);

GRANT SELECT, INSERT, DELETE ON public.user_redeemed_coupons TO authenticated;
GRANT ALL ON public.user_redeemed_coupons TO service_role;

ALTER TABLE public.user_redeemed_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their redeemed coupons"
  ON public.user_redeemed_coupons FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem coupons for themselves"
  ON public.user_redeemed_coupons FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their redeemed coupons"
  ON public.user_redeemed_coupons FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_redeemed_coupons_user ON public.user_redeemed_coupons (user_id, redeemed_at DESC);