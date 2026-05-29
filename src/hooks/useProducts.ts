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
    costPrice: r.cost_price ? Number(r.cost_price) : 0,
    onSale: r.on_sale === true,
    discountType: (r.discount_type as "percentage" | "fixed") ?? "percentage",
    discountValue: r.discount_value ? Number(r.discount_value) : 0,
    salePrice: r.sale_price ? Number(r.sale_price) : undefined,
    saleStart: r.sale_start ?? null,
    saleEnd: r.sale_end ?? null,
    saleLabel: r.sale_label ?? null,
  } as Product;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("id,name,price,original_price,image,category,category_id,sections,unit,description,active,on_sale,discount_type,discount_value,sale_price,sale_start,sale_end,sale_label")
      .order("name");
    let rows = (data ?? []) as any[];
    // Admins may also fetch cost prices via a security-definer RPC.
    const { data: costs } = await supabase.rpc("get_admin_product_costs");
    if (Array.isArray(costs) && costs.length > 0) {
      const map = new Map(costs.map((c: any) => [c.id, Number(c.cost_price)]));
      rows = rows.map((r) => ({ ...r, cost_price: map.get(r.id) ?? 0 }));
    }
    setProducts(rows.map(fromRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`products-feed-${Math.random().toString(36).slice(2)}`)
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
