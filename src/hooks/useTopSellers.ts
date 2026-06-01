import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Aggregates the most-sold product IDs from recent orders. */
export function useTopSellers(limit = 6) {
  const [topIds, setTopIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("items")
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      const counts = new Map<string, number>();
      for (const row of (data ?? []) as any[]) {
        const items = Array.isArray(row.items) ? row.items : [];
        for (const it of items) {
          const id = it?.product?.id ?? it?.id;
          const qty = Number(it?.quantity ?? 1);
          if (!id) continue;
          counts.set(id, (counts.get(id) ?? 0) + qty);
        }
      }
      const ids = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);
      setTopIds(ids);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [limit]);

  return { topIds, loading };
}
