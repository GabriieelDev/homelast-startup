import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";

function fromRow(r: any): Product {
  return {
    id: r.id,
    name: r.name,
    price: Number(r.price),
    originalPrice: r.original_price ? Number(r.original_price) : undefined,
    image: r.image,
    category: r.category,
    section: Array.isArray(r.sections) ? r.sections : [],
    unit: r.unit ?? "un",
    description: r.description ?? "",
    active: r.active !== false,
  } as Product;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts((data ?? []).map(fromRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("products-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const getById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  );

  return { products, loading, getById, refresh: load };
}
