import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useStock() {
  const [stock, setStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("product_stock").select("product_id, stock");
      if (!mounted) return;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { map[r.product_id] = r.stock; });
      setStock(map);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel("stock-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_stock" }, (payload: any) => {
        const row = payload.new ?? payload.old;
        if (!row) return;
        setStock((prev) => ({ ...prev, [row.product_id]: payload.new?.stock ?? 0 }));
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  const getStock = (productId: string) => stock[productId] ?? 99;
  const isAvailable = (productId: string) => getStock(productId) > 0;
  const isLow = (productId: string) => {
    const s = getStock(productId);
    return s > 0 && s <= 5;
  };

  return { stock, getStock, isAvailable, isLow, loading };
}
