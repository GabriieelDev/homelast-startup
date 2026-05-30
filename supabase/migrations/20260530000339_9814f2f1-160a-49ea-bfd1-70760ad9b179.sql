ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS carousel_config jsonb NOT NULL DEFAULT '{
  "slide1": {
    "enabled": true,
    "badge": "Entrega em 30–60 min",
    "title": "Seu supermercado em minutos",
    "highlight": "em minutos",
    "subtitle": "Compre rápido, receba rápido. Sem filas, sem complicação.",
    "ctaText": "Começar agora",
    "feature1Title": "Entrega expressa",
    "feature1Text": "Receba em até 1 hora",
    "feature2Title": "Compra segura",
    "feature2Text": "Pagamento protegido",
    "feature3Title": "Qualidade garantida",
    "feature3Text": "Produtos frescos",
    "image": ""
  },
  "slide2": {
    "enabled": true,
    "badge": "Ofertas do dia",
    "title": "Produtos com até 30% OFF",
    "highlight": "30% OFF",
    "subtitle": "Aproveite as melhores ofertas antes que acabem!",
    "ctaText": "Ver todas as ofertas",
    "productIds": [],
    "countdownEnd": null
  },
  "slide3": {
    "enabled": true,
    "badge": "Oferta especial",
    "title": "Primeira compra com 10% OFF",
    "coupon": "BEMVINDO10",
    "conditions": "Válido para novos clientes. Pedido mínimo R$ 50.",
    "ctaText": "Aproveitar agora"
  }
}'::jsonb;