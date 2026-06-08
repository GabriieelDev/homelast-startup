import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AppliedCoupon {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed" | "free_shipping" | "first_order";
  discount_value: number;
  min_order: number;
  discountAmount: number; // calculated discount in R$
  freeShipping: boolean;
}

interface CalcParams {
  subtotal: number;
  shipping: number;
}

export function useCoupon() {
  const { user } = useAuth();
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apply = useCallback(
    async (code: string, { subtotal, shipping }: CalcParams) => {
      setError(null);
      setLoading(true);
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        setError("Informe um código de cupom.");
        setLoading(false);
        return false;
      }

      const { data, error: dbError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", normalized)
        .eq("active", true)
        .maybeSingle();

      setLoading(false);

      if (dbError || !data) {
        setError("Cupom inválido ou expirado.");
        setCoupon(null);
        return false;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("Cupom inválido ou expirado.");
        setCoupon(null);
        return false;
      }
      if ((data as any).max_uses != null && Number((data as any).used_count ?? 0) >= Number((data as any).max_uses)) {
        setError("Este cupom atingiu o limite de usos.");
        setCoupon(null);
        return false;
      }
      if (subtotal < Number(data.min_order || 0)) {
        setError(`Pedido mínimo de R$ ${Number(data.min_order).toFixed(2)} para usar este cupom.`);
        setCoupon(null);
        return false;
      }

      // First-order check
      if (data.discount_type === "first_order" && user) {
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        if ((count ?? 0) > 0) {
          setError("Cupom válido apenas na primeira compra.");
          setCoupon(null);
          return false;
        }
      }

      let discountAmount = 0;
      let freeShipping = false;
      switch (data.discount_type) {
        case "percentage":
        case "first_order":
          discountAmount = (subtotal * Number(data.discount_value)) / 100;
          break;
        case "fixed":
          discountAmount = Number(data.discount_value);
          break;
        case "free_shipping":
          freeShipping = true;
          discountAmount = shipping;
          break;
      }
      discountAmount = Math.min(discountAmount, subtotal + shipping);

      setCoupon({
        code: data.code,
        description: data.description ?? "",
        discount_type: data.discount_type as AppliedCoupon["discount_type"],
        discount_value: Number(data.discount_value),
        min_order: Number(data.min_order ?? 0),
        discountAmount,
        freeShipping,
      });
      return true;
    },
    [user]
  );

  const clear = useCallback(() => {
    setCoupon(null);
    setError(null);
  }, []);

  return { coupon, error, loading, apply, clear };
}
