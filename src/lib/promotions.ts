import type { Product } from "@/data/products";

export function isSaleActive(p: Product | undefined | null): boolean {
  if (!p?.onSale) return false;
  const now = Date.now();
  if (p.saleStart && new Date(p.saleStart).getTime() > now) return false;
  if (p.saleEnd && new Date(p.saleEnd).getTime() < now) return false;
  if (!p.salePrice || p.salePrice <= 0) return false;
  return p.salePrice < p.price;
}

export function getEffectivePrice(p: Product): number {
  return isSaleActive(p) && p.salePrice ? p.salePrice : p.price;
}

export function getDiscountPct(p: Product): number {
  if (!isSaleActive(p) || !p.salePrice) return 0;
  return Math.round(((p.price - p.salePrice) / p.price) * 100);
}

export function getSaleBadgeLabel(p: Product): string {
  if (p.saleLabel?.trim()) return p.saleLabel.trim();
  const pct = getDiscountPct(p);
  return pct > 0 ? `-${pct}% OFF` : "OFERTA";
}

export function getSavings(p: Product): number {
  if (!isSaleActive(p) || !p.salePrice) return 0;
  return Math.max(0, p.price - p.salePrice);
}
