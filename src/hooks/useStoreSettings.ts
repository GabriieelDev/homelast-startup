import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
};

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("store_settings").select("*").eq("id", "main").maybeSingle();
    if (data) {
      setSettings({
        ...DEFAULTS,
        ...data,
        min_order: Number(data.min_order ?? 0),
        min_shipping: Number(data.min_shipping ?? 5),
        max_shipping: Number(data.max_shipping ?? 15),
      } as StoreSettings);
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
      .update(patch)
      .eq("id", "main");
    if (!error) await load();
    return error;
  }, [load]);

  return { settings, loading, save };
}
