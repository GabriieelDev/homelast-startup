import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDisabledProducts = () => {
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("disabled_products").select("product_id");
    setDisabled(new Set((data ?? []).map((r: any) => r.product_id)));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("disabled_products_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "disabled_products" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const isDisabled = (productId: string) => disabled.has(productId);

  const disableProduct = async (productId: string) => {
    const { error } = await supabase.from("disabled_products").insert({ product_id: productId });
    if (error) {
      toast.error("Erro ao remover produto");
      return false;
    }
    toast.success("Produto removido do catálogo");
    return true;
  };

  const enableProduct = async (productId: string) => {
    const { error } = await supabase.from("disabled_products").delete().eq("product_id", productId);
    if (error) {
      toast.error("Erro ao reativar produto");
      return false;
    }
    toast.success("Produto reativado");
    return true;
  };

  return { isDisabled, disableProduct, enableProduct, loading, disabledIds: disabled };
};
