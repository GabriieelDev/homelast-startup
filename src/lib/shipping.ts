import type { StoreSettings } from "@/hooks/useStoreSettings";

/**
 * Cálculo único de frete usado em todo o app.
 * - Se subtotal >= free_shipping_threshold  → frete grátis (0)
 * - Caso contrário                          → flat_shipping_fee
 */
export function calcShipping(
  subtotal: number,
  settings: Pick<StoreSettings, "free_shipping_threshold" | "flat_shipping_fee">,
): number {
  const threshold = Number(settings.free_shipping_threshold ?? 0);
  const fee = Number(settings.flat_shipping_fee ?? 0);
  if (threshold > 0 && subtotal >= threshold) return 0;
  return Math.max(0, Number(fee.toFixed(2)));
}
