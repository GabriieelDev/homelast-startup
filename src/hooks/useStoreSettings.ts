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
  image: string;
}
export interface CarouselSlide3 {
  enabled: boolean;
  badge: string;
  title: string;
  coupon: string;
  conditions: string;
  ctaText: string;
  image: string;
}
export interface CarouselConfig {
  slide1: CarouselSlide1;
  slide2: CarouselSlide2;
  slide3: CarouselSlide3;
  auto_transition: boolean;
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
    image: "",
  },
  slide3: {
    enabled: true,
    badge: "Oferta especial",
    title: "Primeira compra com 10% OFF",
    coupon: "BEMVINDO10",
    conditions: "Válido para novos clientes. Pedido mínimo R$ 50.",
    ctaText: "Aproveitar agora",
    image: "",
  },
  auto_transition: true,
};

export type HomeSectionKey =
  | "top_sellers"
  | "recently_viewed"
  | "promocoes"
  | "recomendados"
  | "frequentes"
  | "mais-comprados";

export interface HomeSection {
  key: HomeSectionKey;
  title: string;
  emoji: string;
  enabled: boolean;
  /** null = no limit */
  limit: number | null;
}

/** Default order. "mais-comprados" is the catch-all and must stay last. */
export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { key: "top_sellers", title: "Mais vendidos", emoji: "🔥", enabled: true, limit: 6 },
  { key: "recently_viewed", title: "Vistos recentemente", emoji: "👁️", enabled: true, limit: 6 },
  { key: "promocoes", title: "Promoções", emoji: "🏷️", enabled: true, limit: 8 },
  { key: "recomendados", title: "Recomendados", emoji: "✨", enabled: true, limit: 8 },
  { key: "frequentes", title: "Itens frequentes", emoji: "🔄", enabled: true, limit: 8 },
  { key: "mais-comprados", title: "Mais comprados", emoji: "🔥", enabled: true, limit: null },
];

export interface StoreSettings {
  id: string;
  name: string;
  phone: string;
  address: string;
  hours: string;
  min_order: number;
  min_shipping: number;
  max_shipping: number;
  free_shipping_threshold: number;
  flat_shipping_fee: number;
  alerts_enabled: boolean;
  low_stock_threshold: number;
  late_order_minutes: number;
  sales_drop_pct: number;
  social_links: SocialLink[];
  carousel_config: CarouselConfig;
  home_sections: HomeSection[];
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
  free_shipping_threshold: 50,
  flat_shipping_fee: 8,
  alerts_enabled: true,
  low_stock_threshold: 5,
  late_order_minutes: 60,
  sales_drop_pct: 30,
  social_links: [],
  carousel_config: DEFAULT_CAROUSEL,
  home_sections: DEFAULT_HOME_SECTIONS,
};

const STORE_SETTINGS_SELECT = "id,name,phone,address,hours,min_order,min_shipping,max_shipping,free_shipping_threshold,flat_shipping_fee,social_links,carousel_config,home_sections,updated_at";

let cachedSettings: StoreSettings = DEFAULTS;
let hasLoadedSettings = false;
let settingsLoadPromise: Promise<StoreSettings | null> | null = null;
let settingsReadToken = 0;
const settingsListeners = new Set<(settings: StoreSettings) => void>();

function publishSettings(next: StoreSettings) {
  cachedSettings = next;
  hasLoadedSettings = true;
  settingsListeners.forEach((listener) => listener(next));
}

function hasField(row: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(row, field);
}

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
    auto_transition: typeof r.auto_transition === "boolean" ? r.auto_transition : true,
  };
}

/**
 * Validates the stored list: keeps saved order, drops unknown/duplicate keys,
 * fills in missing keys (from the defaults) at the end, accepts `limit: null`.
 */
export function parseHomeSections(raw: unknown): HomeSection[] {
  let arr: unknown = raw;
  if (typeof arr === "string") {
    try { arr = JSON.parse(arr); } catch { arr = []; }
  }
  const defaults = new Map(DEFAULT_HOME_SECTIONS.map((d) => [d.key, d]));
  const seen = new Set<HomeSectionKey>();
  const out: HomeSection[] = [];

  if (Array.isArray(arr)) {
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const def = typeof r.key === "string" ? defaults.get(r.key as HomeSectionKey) : undefined;
      if (!def || seen.has(def.key)) continue;
      seen.add(def.key);
      const title = typeof r.title === "string" && r.title.trim() ? r.title.trim().slice(0, 60) : def.title;
      const emoji = typeof r.emoji === "string" ? r.emoji.trim().slice(0, 8) : def.emoji;
      const enabled = typeof r.enabled === "boolean" ? r.enabled : def.enabled;
      let limit: number | null = def.limit;
      if (r.limit === null) limit = null;
      else if (typeof r.limit === "number" && Number.isFinite(r.limit) && r.limit >= 1) limit = Math.floor(r.limit);
      out.push({ key: def.key, title, emoji, enabled, limit });
    }
  }
  for (const d of DEFAULT_HOME_SECTIONS) {
    if (!seen.has(d.key)) out.push({ ...d });
  }
  return out;
}

function mapStoreSettingsRow(
  row: Record<string, unknown>,
  admin: Record<string, unknown> | null,
  previous: StoreSettings,
): StoreSettings {
  const socialLinks = hasField(row, "social_links")
    ? parseSocialLinks(row.social_links)
    : previous.social_links;
  const carouselConfig = hasField(row, "carousel_config")
    ? parseCarousel(row.carousel_config)
    : previous.carousel_config;

  const homeSections = hasField(row, "home_sections")
    ? parseHomeSections(row.home_sections)
    : previous.home_sections;

  return {
    ...previous,
    id: typeof row.id === "string" ? row.id : previous.id,
    name: typeof row.name === "string" ? row.name : previous.name,
    phone: typeof row.phone === "string" ? row.phone : previous.phone,
    address: typeof row.address === "string" ? row.address : previous.address,
    hours: typeof row.hours === "string" ? row.hours : previous.hours,
    min_order: Number(row.min_order ?? previous.min_order),
    min_shipping: Number(row.min_shipping ?? previous.min_shipping),
    max_shipping: Number(row.max_shipping ?? previous.max_shipping),
    free_shipping_threshold: Number(row.free_shipping_threshold ?? previous.free_shipping_threshold),
    flat_shipping_fee: Number(row.flat_shipping_fee ?? previous.flat_shipping_fee),
    alerts_enabled: typeof admin?.alerts_enabled === "boolean" ? admin.alerts_enabled : previous.alerts_enabled,
    low_stock_threshold: Number(admin?.low_stock_threshold ?? previous.low_stock_threshold),
    late_order_minutes: Number(admin?.late_order_minutes ?? previous.late_order_minutes),
    sales_drop_pct: Number(admin?.sales_drop_pct ?? previous.sales_drop_pct),
    social_links: socialLinks,
    carousel_config: carouselConfig,
    home_sections: homeSections,
  };
}

async function fetchStoreSettingsFromDb(): Promise<StoreSettings | null> {
  const token = ++settingsReadToken;
  const [{ data, error }, { data: adminRows, error: adminError }] = await Promise.all([
    supabase
      .from("store_settings")
      .select(STORE_SETTINGS_SELECT)
      .eq("id", "main")
      .maybeSingle(),
    supabase.rpc("get_admin_store_settings"),
  ]);

  if (error) {
    console.error("Erro ao carregar configurações da loja", error);
    return null;
  }

  if (!data || token !== settingsReadToken) return null;

  // If the admin RPC failed (non-admin, transient error, breaker open),
  // preserve whatever admin fields we already had in cachedSettings instead of
  // falling back to DEFAULTS. mapStoreSettingsRow already reads from `previous`
  // when `admin` is null, so passing null here is exactly the desired behavior.
  const admin = !adminError && Array.isArray(adminRows) && adminRows[0]
    ? (adminRows[0] as Record<string, unknown>)
    : null;
  return mapStoreSettingsRow(data as Record<string, unknown>, admin, cachedSettings);
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(cachedSettings);
  const [loading, setLoading] = useState(!hasLoadedSettings);

  const load = useCallback(async () => {
    settingsLoadPromise ??= fetchStoreSettingsFromDb().finally(() => {
      settingsLoadPromise = null;
    });
    const next = await settingsLoadPromise;
    if (next) publishSettings(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    settingsListeners.add(setSettings);
    load();
    const channel = supabase
      .channel(`store-settings-feed-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, load)
      .subscribe();
    return () => {
      settingsListeners.delete(setSettings);
      supabase.removeChannel(channel);
    };
  }, [load]);

  const save = useCallback(async (patch: Partial<StoreSettings>) => {
    const { data, error } = await supabase
      .from("store_settings")
      .update(patch as Record<string, unknown>)
      .eq("id", "main")
      .select(STORE_SETTINGS_SELECT);
    if (error) return error;
    if (!data || data.length === 0) {
      return { message: "Nenhuma linha foi atualizada. Verifique suas permissões de admin." };
    }
    settingsLoadPromise = null;
    const confirmed = await load();
    if (!confirmed) return { message: "Salvo, mas não foi possível confirmar a leitura no banco." };
    return null;
  }, [load]);

  return { settings, loading, save };
}
