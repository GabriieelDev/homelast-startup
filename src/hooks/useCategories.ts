import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
    const { data } = await q;
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }, [opts.onlyActive]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    load();
    if (channelRef.current) return;
    const channel = supabase.channel(`categories-${Math.random().toString(36).slice(2)}`);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "categories" }, load);
    channel.subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
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
