import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/data/products";

interface Props {
  variants: Product[];
  labels: string[];
  getQuantity: (id: string) => number;
  getStock?: (id: string) => number;
  onAdd: (product: Product) => void;
  onRemove: (id: string) => void;
  isAdmin?: boolean;
  onDisableProduct?: (id: string) => void;
}

const VariantProductCard = ({ variants, labels, getQuantity, getStock, onAdd, onRemove, isAdmin, onDisableProduct }: Props) => {
  // Default = variant with highest stock; ties → first in list; all zero → first.
  const defaultId = useMemo(() => {
    if (variants.length === 0) return "";
    let bestId = variants[0].id;
    let bestStock = getStock ? getStock(variants[0].id) : 0;
    for (let i = 1; i < variants.length; i++) {
      const s = getStock ? getStock(variants[i].id) : 0;
      if (s > bestStock) {
        bestStock = s;
        bestId = variants[i].id;
      }
    }
    return bestId;
  }, [variants, getStock]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasUserSelectedVariant, setHasUserSelectedVariant] = useState(false);
  const activeId = selectedId ?? defaultId;
  const selected = useMemo(
    () => variants.find((v) => v.id === activeId) ?? variants[0],
    [variants, activeId],
  );
  const chips = useMemo(
    () => variants.map((v, i) => ({ id: v.id, label: labels[i] ?? v.name })),
    [variants, labels],
  );

  const { minPrice, showFromPrice } = useMemo(() => {
    const prices = variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { minPrice: min, showFromPrice: min !== max && !hasUserSelectedVariant };
  }, [variants, hasUserSelectedVariant]);

  return (
    <ProductCard
      product={selected}
      quantity={getQuantity(selected.id)}
      stock={getStock ? getStock(selected.id) : 99}
      onAdd={() => onAdd(selected)}
      onRemove={() => onRemove(selected.id)}
      isAdmin={isAdmin}
      onDisable={onDisableProduct ? () => onDisableProduct(selected.id) : undefined}
      variants={chips}
      selectedVariantId={selected.id}
      onSelectVariant={(id) => {
        setHasUserSelectedVariant(true);
        setSelectedId(id);
      }}
      fromPrice={showFromPrice ? minPrice : undefined}
    />
  );
};

export default VariantProductCard;
