import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

interface ValidateCouponResult {
  valid: boolean;
  reason: "ok" | "login" | "invalid" | "expired" | "min_order" | "used" | "first_order";
  min_order?: number;
  coupon?: {
    id: string;
    code: string;
    description: string | null;
    discount_type: string;
    discount_value: number;
    min_order: number | null;
    expires_at: string | null;
  };
}

export function useCoupon() {
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

      const { data: result, error: dbError } = await supabase.rpc("validate_coupon", {
        p_code: normalized,
        p_subtotal: subtotal,
      });

      setLoading(false);

      const res = result as unknown as ValidateCouponResult | null;
      const data = res?.coupon;

      if (dbError || !res || !res.valid || !data) {
        switch (res?.reason) {
          case "min_order":
            setError(`Pedido mínimo de R$ ${Number(res.min_order ?? 0).toFixed(2)} para usar este cupom.`);
            break;
          case "first_order":
            setError("Cupom válido apenas na primeira compra.");
            break;
          case "used":
            setError("Você já usou este cupom");
            break;
          default:
            // invalid, expired, login ou erro de rede
            setError("Cupom inválido ou expirado.");
        }
        setCoupon(null);
        return false;
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
    []
  );

  const clear = useCallback(() => {
    setCoupon(null);
    setError(null);
  }, []);

  return { coupon, error, loading, apply, clear };
}
