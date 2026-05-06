// Simple dynamic delivery time estimator (deterministic-ish, no real geo)
export function estimateDeliveryMinutes(itemCount: number, address?: any): { min: number; max: number; label: string } {
  // Pseudo-distance based on neighborhood/city string length — gives variation per address
  const seed = ((address?.neighborhood ?? "") + (address?.city ?? "")).length;
  const distanceFactor = Math.min(15, 5 + (seed % 11)); // 5–15 min
  const itemFactor = Math.min(20, Math.ceil(itemCount * 1.2)); // ~1.2 min per item, capped
  const base = 15;
  const min = base + Math.round(distanceFactor * 0.5) + Math.round(itemFactor * 0.4);
  const max = min + 10 + Math.round(itemFactor * 0.5);
  return { min, max, label: `${min}–${max} min` };
}
