import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  active: boolean;
}

export function useCategories(opts: { onlyActive?: boolean } = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from("categories").select("*").order("display_order");
    if (opts.onlyActive) q = q.eq("active", true);
    const { data, error } = await q;
    if (error) console.error("[useCategories] load error:", error);
    console.log("[useCategories] loaded:", (data ?? []).length);
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }, [opts.onlyActive]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("categories-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { categories, loading, refresh: load };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
