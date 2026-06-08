
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS max_uses integer,
  ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE upper(code) = upper(_code)
    AND active = true
    AND (max_uses IS NULL OR COALESCE(used_count, 0) < max_uses);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text) TO authenticated;
