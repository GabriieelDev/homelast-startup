import { useEffect, useState, useCallback, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";

const PRODUCT_COLUMNS =
  "id,name,price,original_price,image,category,category_id,sections,unit,description,active,on_sale,discount_type,discount_value,sale_price,sale_start,sale_end,sale_label";

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
      .select(PRODUCT_COLUMNS)
      .order("name");
    let rows = (data ?? []) as any[];
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

const PAGE_SIZE = 20;

/**
 * Paginated products for the home feed.
 * - Server-side filter by category ("all" = no filter, "sale" = on_sale=true).
 * - Client-side search/section filtering is applied by the caller on top of `products`.
 */
export function useInfiniteProducts(category: string = "all") {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["products-infinite", category] as const, [category]);

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) ?? 0;
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .order("name")
        .range(from, to);
      if (category === "sale") q = q.eq("on_sale", true);
      else if (category && category !== "all") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) {
        console.error("Erro produtos:", error);
        throw error;
      }
      return ((data ?? []) as any[]).map(fromRow);
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length : undefined,
    retry: 2,
    retryDelay: 1000,
    staleTime: 60_000,
  });

  if (query.error) {
    console.error("Erro produtos (query):", query.error);
  }

  useEffect(() => {
    const channel = supabase
      .channel(`products-infinite-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        queryClient.invalidateQueries({ queryKey: ["products-infinite"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const products = useMemo(
    () => (query.data?.pages.flat() ?? []) as Product[],
    [query.data],
  );

  return {
    products,
    loading: query.isLoading,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
