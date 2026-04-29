-- Couriers
CREATE TABLE IF NOT EXISTS public.couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('disponivel','em_entrega','offline')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couriers view own profile" ON public.couriers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Couriers update own profile" ON public.couriers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Couriers insert own profile" ON public.couriers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all couriers" ON public.couriers
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage couriers" ON public.couriers
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON public.couriers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders extra fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_address jsonb DEFAULT '{"street":"Av. Central, 1000","neighborhood":"Centro","city":"São Paulo"}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;

CREATE POLICY "Couriers view available orders" ON public.orders
  FOR SELECT USING (
    public.has_role(auth.uid(), 'entregador') AND (courier_id IS NULL OR courier_id = auth.uid())
  );
CREATE POLICY "Couriers update assigned orders" ON public.orders
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'entregador') AND (courier_id = auth.uid() OR courier_id IS NULL)
  );

-- Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed','free_shipping','first_order')),
  discount_value numeric NOT NULL DEFAULT 0,
  min_order numeric DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active coupons" ON public.coupons
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order) VALUES
  ('BEMVINDO10', 'Bem-vindo! 10% de desconto na primeira compra', 'first_order', 10, 0),
  ('SERVBEM15', '15% de desconto em qualquer pedido', 'percentage', 15, 30),
  ('FRETEGRATIS', 'Frete grátis no seu pedido', 'free_shipping', 0, 50),
  ('SERVBEM20', 'R$ 20 de desconto em pedidos acima de R$ 100', 'fixed', 20, 100)
ON CONFLICT (code) DO NOTHING;