-- products table
CREATE TABLE public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  image text NOT NULL DEFAULT '/placeholder.svg',
  category text NOT NULL DEFAULT 'mercearia',
  description text DEFAULT '',
  sections text[] NOT NULL DEFAULT ARRAY['mais-comprados']::text[],
  unit text NOT NULL DEFAULT 'un',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Seed initial catalog
INSERT INTO public.products (id, name, price, original_price, image, category, sections, unit) VALUES
('2','Arroz Integral 5kg',24.90,29.90,'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop&q=80','mercearia',ARRAY['mais-comprados','promocoes'],'un'),
('3','Leite Integral 1L',5.49,NULL,'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop&q=80','bebidas',ARRAY['mais-comprados','frequentes'],'un'),
('6','Coca-Cola 2L',9.99,11.99,'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop&q=80','bebidas',ARRAY['promocoes','mais-comprados'],'un'),
('8','Detergente Ypê',2.49,3.99,'https://images.unsplash.com/photo-1622503043418-7ed81ea2c5d4?w=400&h=400&fit=crop&q=80','limpeza',ARRAY['promocoes','frequentes'],'un'),
('10','Café Pilão 500g',15.90,19.90,'https://images.unsplash.com/photo-1559525839-d9acfd1ed2dc?w=400&h=400&fit=crop&q=80','mercearia',ARRAY['promocoes','mais-comprados'],'un'),
('11','Sabonete Dove',3.99,NULL,'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop&q=80','higiene',ARRAY['recomendados','mais-comprados'],'un'),
('16','Água Mineral 1.5L',2.99,NULL,'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&h=400&fit=crop&q=80','bebidas',ARRAY['frequentes','mais-comprados'],'un'),
('18','Azeite Extra Virgem',22.90,28.90,'https://images.unsplash.com/photo-1601300576487-fb00b5856cea?w=400&h=400&fit=crop&q=80','mercearia',ARRAY['promocoes','recomendados'],'un'),
('20','Papel Higiênico 12un',16.90,21.90,'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&h=400&fit=crop&q=80','higiene',ARRAY['promocoes','frequentes'],'pct'),
('21','Macarrão Espaguete 500g',4.49,NULL,'https://images.unsplash.com/photo-1612966769900-2358d6131e53?w=400&h=400&fit=crop&q=80','mercearia',ARRAY['frequentes','mais-comprados'],'un'),
('22','Óleo de Soja 900ml',7.99,9.99,'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=400&h=400&fit=crop&q=80','mercearia',ARRAY['promocoes','frequentes'],'un'),
('23','Suco de Laranja 1L',6.99,NULL,'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop&q=80','bebidas',ARRAY['recomendados','frequentes'],'un'),
('24','Desinfetante 2L',5.99,7.99,'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400&h=400&fit=crop&q=80','limpeza',ARRAY['promocoes','recomendados'],'un'),
('25','Shampoo Pantene 400ml',18.90,24.90,'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop&q=80','higiene',ARRAY['promocoes','recomendados'],'un'),
('26','Açúcar Refinado 1kg',4.99,NULL,'https://images.unsplash.com/photo-1610137544866-99c0dc7d3b1c?w=400&h=400&fit=crop&q=80','mercearia',ARRAY['mais-comprados','frequentes'],'un'),
('27','Cerveja Heineken 350ml',4.99,6.49,'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop&q=80','bebidas',ARRAY['promocoes','mais-comprados'],'un'),
('28','Sabão em Pó Omo 1kg',12.90,NULL,'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=400&fit=crop&q=80','limpeza',ARRAY['mais-comprados','frequentes'],'un'),
('29','Creme Dental Colgate 90g',5.49,NULL,'https://images.unsplash.com/photo-1559591937-abc3a5b1d9a0?w=400&h=400&fit=crop&q=80','higiene',ARRAY['frequentes','recomendados'],'un'),
('30','Feijão Carioca 1kg',8.90,10.90,'https://images.unsplash.com/photo-1622542796254-5b9c46ab0d2f?w=400&h=400&fit=crop&q=80','mercearia',ARRAY['mais-comprados','promocoes'],'un');

-- store_settings: singleton row (id='main')
CREATE TABLE public.store_settings (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT 'ServBem Supermercado',
  phone text DEFAULT '',
  address text DEFAULT '',
  hours text DEFAULT 'Seg–Sáb 08h–22h · Dom 08h–20h',
  min_order numeric NOT NULL DEFAULT 0,
  min_shipping numeric NOT NULL DEFAULT 5,
  max_shipping numeric NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.store_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_store_settings_updated
BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.store_settings (id) VALUES ('main') ON CONFLICT DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;