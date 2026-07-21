import type { Product } from "@/data/products";

export interface VariantGroup {
  kind: "group";
  key: string;
  group: string;
  variants: Product[];
  labels: string[];
}

export interface SingleEntry {
  kind: "single";
  key: string;
  product: Product;
}

export type FeedEntry = VariantGroup | SingleEntry;

const normalizeGroup = (v: string | null | undefined) =>
  (v ?? "").trim().toLowerCase();

/**
 * Group products that share the same non-empty `variantGroup`.
 *
 * A product with a non-empty `variantGroup` is NEVER emitted as a single card.
 * If `allProducts` is provided, each detected group is expanded to include ALL
 * sibling variants from the catalog (not just the ones present in `products`),
 * so the grouped card always represents the full group even when the current
 * list only contains one variant (e.g. section/top-sellers/recently-viewed
 * filters).
 *
 * Products with empty/null `variantGroup` remain as single entries.
 * Ordering follows the first occurrence of each group / single in `products`.
 */
export function groupByVariant(
  products: Product[],
  allProducts?: Product[],
): FeedEntry[] {
  const groupOrder: string[] = [];
  const groupSeen = new Set<string>();
  const singles: { index: number; product: Product }[] = [];
  const positions = new Map<string, number>();

  products.forEach((p, index) => {
    const g = normalizeGroup(p.variantGroup);
    if (!g) {
      singles.push({ index, product: p });
      return;
    }
    if (!groupSeen.has(g)) {
      groupSeen.add(g);
      groupOrder.push(g);
      positions.set(g, index);
    }
  });

  // Build a lookup of every variant in each group from the catalog when available,
  // so a section that only contains one variant still renders the full grouped card.
  const source = allProducts && allProducts.length > 0 ? allProducts : products;
  const groupVariants = new Map<string, Product[]>();
  for (const p of source) {
    const g = normalizeGroup(p.variantGroup);
    if (!g || !groupSeen.has(g)) continue;
    const arr = groupVariants.get(g);
    if (arr) arr.push(p);
    else groupVariants.set(g, [p]);
  }

  const entries: { pos: number; entry: FeedEntry }[] = [];

  for (const g of groupOrder) {
    const variants = groupVariants.get(g) ?? [];
    if (variants.length === 0) continue;
    // Dedupe by id (in case allProducts overlaps with products).
    const uniq = Array.from(new Map(variants.map((v) => [v.id, v])).values());
    // Sort variants by name so labels are stable and predictable.
    const sorted = uniq.sort((a, b) => a.name.localeCompare(b.name));
    entries.push({
      pos: positions.get(g)!,
      entry: {
        kind: "group",
        key: `group:${g}`,
        group: g,
        variants: sorted,
        labels: extractVariantLabels(sorted.map((v) => v.name)),
      },
    });
  }
  for (const s of singles) {
    entries.push({
      pos: s.index,
      entry: { kind: "single", key: s.product.id, product: s.product },
    });
  }

  entries.sort((a, b) => a.pos - b.pos);
  return entries.map((e) => e.entry);
}

/**
 * Given a list of product names in the same group, return a short distinctive
 * label for each by stripping the shared prefix/suffix. Falls back to the full
 * name when nothing distinctive remains.
 */
export function extractVariantLabels(names: string[]): string[] {
  if (names.length <= 1) return names.map((n) => n);

  const lower = names.map((n) => n.toLowerCase());

  // Common prefix (case-insensitive).
  let prefixLen = lower[0].length;
  for (let i = 1; i < lower.length; i++) {
    let j = 0;
    const max = Math.min(prefixLen, lower[i].length);
    while (j < max && lower[0][j] === lower[i][j]) j++;
    prefixLen = j;
    if (prefixLen === 0) break;
  }

  // Common suffix (case-insensitive).
  let suffixLen = lower[0].length - prefixLen;
  for (let i = 1; i < lower.length; i++) {
    const maxSuf = Math.min(suffixLen, lower[i].length - prefixLen);
    let j = 0;
    while (
      j < maxSuf &&
      lower[0][lower[0].length - 1 - j] === lower[i][lower[i].length - 1 - j]
    ) {
      j++;
    }
    suffixLen = j;
    if (suffixLen === 0) break;
  }

  return names.map((n) => {
    const mid = n.slice(prefixLen, suffixLen ? n.length - suffixLen : n.length);
    const cleaned = mid.replace(/^[\s\-–—,:•|/()]+|[\s\-–—,:•|/()]+$/g, "").trim();
    return cleaned || n;
  });
}
