-- Configuração das seções da home (liga/desliga, título, emoji, limite e ordem).
-- A coluna já foi criada manualmente no banco; este arquivo só versiona o SQL.
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS home_sections jsonb NOT NULL DEFAULT '[
    {"key":"top_sellers","title":"Mais vendidos","emoji":"🔥","enabled":true,"limit":6},
    {"key":"recently_viewed","title":"Vistos recentemente","emoji":"👁️","enabled":true,"limit":6},
    {"key":"promocoes","title":"Promoções","emoji":"🏷️","enabled":true,"limit":8},
    {"key":"recomendados","title":"Recomendados","emoji":"✨","enabled":true,"limit":8},
    {"key":"frequentes","title":"Itens frequentes","emoji":"🔄","enabled":true,"limit":8},
    {"key":"mais-comprados","title":"Mais comprados","emoji":"🔥","enabled":true,"limit":null}
  ]'::jsonb;
