import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const REFETCH_MS = 5 * 60 * 1000;

/** Most-sold product IDs (already ranked by the server). Works for visitors too. */
export function useTopSellers(limit = 6) {
  const { data, isLoading } = useQuery({
    queryKey: ["top-sellers", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("top_sellers", { p_limit: limit, p_days: 365 });
      if (error) throw error;
      return ((data ?? []) as { product_id: string }[]).map((r) => r.product_id).filter(Boolean);
    },
    staleTime: REFETCH_MS,
    refetchInterval: REFETCH_MS,
    refetchOnWindowFocus: "always",
  });

  return { topIds: data ?? [], loading: isLoading };
}
