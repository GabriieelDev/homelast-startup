import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SocialPlatform = "instagram" | "facebook" | "whatsapp" | "tiktok";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
  order: number;
}

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
}

const DEFAULTS: StoreSettings = {
  id: "main",
  name: "ServBem Supermercado",
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
};

function parseSocialLinks(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
    .map((l, i) => ({
      platform: (l.platform as SocialPlatform) ?? "instagram",
      url: typeof l.url === "string" ? l.url : "",
      enabled: l.enabled !== false,
      order: typeof l.order === "number" ? l.order : i,
    }));
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("store_settings").select("*").eq("id", "main").maybeSingle();
    if (data) {
      const d = data as any;
      setSettings({
        ...DEFAULTS,
        ...d,
        min_order: Number(d.min_order ?? 0),
        min_shipping: Number(d.min_shipping ?? 5),
        max_shipping: Number(d.max_shipping ?? 15),
        alerts_enabled: d.alerts_enabled ?? true,
        low_stock_threshold: Number(d.low_stock_threshold ?? 5),
        late_order_minutes: Number(d.late_order_minutes ?? 60),
        sales_drop_pct: Number(d.sales_drop_pct ?? 30),
        social_links: parseSocialLinks(d.social_links),
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("store-settings-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const save = useCallback(async (patch: Partial<StoreSettings>) => {
    const { error } = await supabase
      .from("store_settings")
      .update(patch as any)
      .eq("id", "main");
    if (!error) await load();
    return error;
  }, [load]);

  return { settings, loading, save };
}
