import { useMemo } from "react";
import ProductCard from "./ProductCard";
import VariantProductCard from "./VariantProductCard";
import { Product } from "@/data/products";
import { groupByVariant } from "@/lib/variantGroups";

interface Props {
  title: string;
  emoji: string;
  products: Product[];
  getQuantity: (id: string) => number;
  getStock?: (id: string) => number;
  onAdd: (p: Product) => void;
  onRemove: (id: string) => void;
}

const HorizontalProductRow = ({ title, emoji, products, getQuantity, getStock, onAdd, onRemove }: Props) => {
  const entries = useMemo(() => groupByVariant(products), [products]);
  if (entries.length === 0) return null;

  const renderCard = (entry: ReturnType<typeof groupByVariant>[number]) => {
    if (entry.kind === "group") {
      return (
        <VariantProductCard
          variants={entry.variants}
          labels={entry.labels}
          getQuantity={getQuantity}
          getStock={getStock}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      );
    }
    const p = entry.product;
    return (
      <ProductCard
        product={p}
        quantity={getQuantity(p.id)}
        stock={getStock ? getStock(p.id) : 99}
        onAdd={() => onAdd(p)}
        onRemove={() => onRemove(p.id)}
      />
    );
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      {/* Mobile: horizontal scroll; md+: grid */}
      <div className="flex md:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {entries.map((entry) => (
          <div key={entry.key} className="min-w-[160px] w-[160px] shrink-0 snap-start">
            {renderCard(entry)}
          </div>
        ))}
      </div>
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-4">
        {entries.map((entry) => (
          <div key={entry.key}>{renderCard(entry)}</div>
        ))}
      </div>
    </section>
  );
};

export default HorizontalProductRow;
