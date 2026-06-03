import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SocialPlatform = "instagram" | "facebook" | "whatsapp" | "tiktok";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
  order: number;
}

export interface CarouselSlide1 {
  enabled: boolean;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaText: string;
  feature1Title: string;
  feature1Text: string;
  feature2Title: string;
  feature2Text: string;
  feature3Title: string;
  feature3Text: string;
  image: string;
}
export interface CarouselSlide2 {
  enabled: boolean;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaText: string;
  productIds: string[];
  countdownEnd: string | null;
}
export interface CarouselSlide3 {
  enabled: boolean;
  badge: string;
  title: string;
  coupon: string;
  conditions: string;
  ctaText: string;
}
export interface CarouselConfig {
  slide1: CarouselSlide1;
  slide2: CarouselSlide2;
  slide3: CarouselSlide3;
}

export const DEFAULT_CAROUSEL: CarouselConfig = {
  slide1: {
    enabled: true,
    badge: "Entrega em 30–60 min",
    title: "Seu supermercado em minutos",
    highlight: "em minutos",
    subtitle: "Compre rápido, receba rápido. Sem filas, sem complicação.",
    ctaText: "Começar agora",
    feature1Title: "Entrega expressa",
    feature1Text: "Receba em até 1 hora",
    feature2Title: "Compra segura",
    feature2Text: "Pagamento protegido",
    feature3Title: "Qualidade garantida",
    feature3Text: "Produtos frescos",
    image: "",
  },
  slide2: {
    enabled: true,
    badge: "Ofertas do dia",
    title: "Produtos com até 30% OFF",
    highlight: "30% OFF",
    subtitle: "Aproveite as melhores ofertas antes que acabem!",
    ctaText: "Ver todas as ofertas",
    productIds: [],
    countdownEnd: null,
  },
  slide3: {
    enabled: true,
    badge: "Oferta especial",
    title: "Primeira compra com 10% OFF",
    coupon: "BEMVINDO10",
    conditions: "Válido para novos clientes. Pedido mínimo R$ 50.",
    ctaText: "Aproveitar agora",
  },
};

export interface StoreSettings {
  id: string;
  name: string;
  phone: string;
  address: string;
  hours: string;
  min_order: number;
  min_shipping: number;
  max_shipping: number;
  alerts_enabled: boolean;
  low_stock_threshold: number;
  late_order_minutes: number;
  sales_drop_pct: number;
  social_links: SocialLink[];
  carousel_config: CarouselConfig;
}

const DEFAULTS: StoreSettings = {
  id: "main",
  name: "HomeLast Startup",
  phone: "",
  address: "",
  hours: "Seg–Sáb 08h–22h · Dom 08h–20h",
  min_order: 0,
  min_shipping: 5,
  max_shipping: 15,
  alerts_enabled: true,
  low_stock_threshold: 5,
  late_order_minutes: 60,
  sales_drop_pct: 30,
  social_links: [],
  carousel_config: DEFAULT_CAROUSEL,
};

const SOCIAL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "whatsapp", "tiktok"];

function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === "string" && SOCIAL_PLATFORMS.includes(value as SocialPlatform);
}

function isSocialLinkRecord(value: unknown): value is Record<string, unknown> & { platform: SocialPlatform } {
  return !!value && typeof value === "object" && isSocialPlatform((value as Record<string, unknown>).platform);
}

function readJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Erro ao parsear social_links", error);
      return [];
    }
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).map(([platform, value]) => ({
      platform,
      ...(value && typeof value === "object" ? value : { url: value }),
    }));
  }
  return [];
}

function parseSocialLinks(raw: unknown): SocialLink[] {
  return readJsonArray(raw)
    .filter(isSocialLinkRecord)
    .map((l, i) => {
      const url = typeof l.url === "string" ? l.url : "";
      return {
        platform: l.platform,
        url,
        enabled: typeof l.enabled === "boolean" ? l.enabled : !!url.trim(),
        order: typeof l.order === "number" ? l.order : i,
      };
    })
    .sort((a, b) => a.order - b.order);
}

function parseCarousel(raw: unknown): CarouselConfig {
  const r = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const slide1 = r.slide1 && typeof r.slide1 === "object" ? r.slide1 as Partial<CarouselSlide1> : {};
  const slide2 = r.slide2 && typeof r.slide2 === "object" ? r.slide2 as Partial<CarouselSlide2> : {};
  const slide3 = r.slide3 && typeof r.slide3 === "object" ? r.slide3 as Partial<CarouselSlide3> : {};
  return {
    slide1: { ...DEFAULT_CAROUSEL.slide1, ...slide1, enabled: true },
    slide2: {
      ...DEFAULT_CAROUSEL.slide2,
      ...slide2,
      productIds: Array.isArray(slide2.productIds) ? slide2.productIds : [],
    },
    slide3: { ...DEFAULT_CAROUSEL.slide3, ...slide3 },
  };
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("store_settings")
      .select("id,name,phone,address,hours,min_order,min_shipping,max_shipping,social_links,carousel_config,updated_at")
      .eq("id", "main")
      .maybeSingle();
    if (error) {
      console.error("Erro ao carregar configurações da loja", error);
      setLoading(false);
      return;
    }
    const { data: adminRows } = await supabase.rpc("get_admin_store_settings");
    const admin = Array.isArray(adminRows) && adminRows[0] ? adminRows[0] as Record<string, unknown> : null;
    if (data) {
      const d = data as Record<string, unknown>;
      const hasSocialLinks = Object.prototype.hasOwnProperty.call(d, "social_links");
      const parsedSocialLinks = hasSocialLinks ? parseSocialLinks(d.social_links) : null;
      setSettings((current) => ({
        ...DEFAULTS,
        ...current,
        ...d,
        min_order: Number(d.min_order ?? 0),
        min_shipping: Number(d.min_shipping ?? 5),
        max_shipping: Number(d.max_shipping ?? 15),
        alerts_enabled: admin?.alerts_enabled ?? DEFAULTS.alerts_enabled,
        low_stock_threshold: Number(admin?.low_stock_threshold ?? DEFAULTS.low_stock_threshold),
        late_order_minutes: Number(admin?.late_order_minutes ?? DEFAULTS.late_order_minutes),
        sales_drop_pct: Number(admin?.sales_drop_pct ?? DEFAULTS.sales_drop_pct),
        social_links: hasSocialLinks && parsedSocialLinks
          ? parsedSocialLinks
          : current.social_links,
        carousel_config: parseCarousel(d.carousel_config),
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`store-settings-feed-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const save = useCallback(async (patch: Partial<StoreSettings>) => {
    const { data, error } = await supabase
      .from("store_settings")
      .update(patch as Record<string, unknown>)
      .eq("id", "main")
      .select("id");
    if (error) return error;
    if (!data || data.length === 0) {
      return { message: "Nenhuma linha foi atualizada. Verifique suas permissões de admin." };
    }
    await load();
    return null;
  }, [load]);

  return { settings, loading, save };
}
