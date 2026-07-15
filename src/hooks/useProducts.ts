import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useInfiniteQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";

const PRODUCT_COLUMNS =
  "id,name,price,original_price,image,category,category_id,sections,unit,description,active,on_sale,discount_type,discount_value,sale_price,sale_start,sale_end,sale_label,variant_group";


interface UseProductsOptions {
  includeAdminCosts?: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadAdminProductCosts(maxRetries = 1): Promise<any[] | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const { data, error, status } = await supabase.rpc("get_admin_product_costs");

    if (!error) return Array.isArray(data) ? data : [];

    console.error("[Products] Falha em get_admin_product_costs:", {
      status,
      code: error.code,
      message: error.message,
      attempt: attempt + 1,
    });

    if ([400, 401, 403].includes(status) || attempt === maxRetries) {
      // Signal failure so callers can preserve previous data instead of zeroing costs.
      return null;
    }

    await sleep(750 * (attempt + 1));
  }

  return null;
}

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
    variantGroup: r.variant_group ?? null,
  } as Product;
}


export function useProducts({ includeAdminCosts = false }: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const lastCostsRef = useRef<Map<string, number>>(new Map());

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("name");

    if (error) {
      console.error("[Products] Falha ao carregar produtos:", error);
      // Preserve last successful data — never wipe the UI on transient errors.
      setLoading(false);
      return;
    }

    let rows = (data ?? []) as any[];
    if (includeAdminCosts) {
      const costs = await loadAdminProductCosts();
      if (costs !== null) {
        lastCostsRef.current = new Map(costs.map((c: any) => [c.id, Number(c.cost_price)]));
      }
      const map = lastCostsRef.current;
      rows = rows.map((r) => ({ ...r, cost_price: map.get(r.id) ?? 0 }));
    }
    setProducts(rows.map(fromRow));
    setLoading(false);
  }, [includeAdminCosts]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    load();
    if (channelRef.current) return;
    const channel = supabase.channel(`products-feed-${Math.random().toString(36).slice(2)}`);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "products" }, load);
    channel.subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
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
    placeholderData: keepPreviousData,
  });

  if (query.error) {
    console.error("Erro produtos (query):", query.error);
  }

  const infiniteChannelRef = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    if (infiniteChannelRef.current) return;
    const channel = supabase.channel(`products-infinite-${Math.random().toString(36).slice(2)}`);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
      // Skip invalidation while the last fetch errored — keeps previous data on-screen
      // instead of thrashing a failing query.
      if (query.isError) return;
      queryClient.invalidateQueries({ queryKey: ["products-infinite"] });
    });
    channel.subscribe();
    infiniteChannelRef.current = channel;
    return () => {
      if (infiniteChannelRef.current) {
        supabase.removeChannel(infiniteChannelRef.current);
        infiniteChannelRef.current = null;
      }
    };
  }, [queryClient, query.isError]);

  const products = useMemo(
    () => (query.data?.pages.flat() ?? []) as Product[],
    [query.data],
  );

  return {
    products,
    loading: query.isLoading,
    isFetching: query.isFetching,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error,
  };
}
