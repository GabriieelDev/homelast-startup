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
  const [selectedId, setSelectedId] = useState<string>(variants[0]?.id ?? "");
  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? variants[0],
    [variants, selectedId],
  );
  const chips = useMemo(
    () => variants.map((v, i) => ({ id: v.id, label: labels[i] ?? v.name })),
    [variants, labels],
  );

  if (!selected) return null;

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
      onSelectVariant={setSelectedId}
    />
  );
};

export default VariantProductCard;
