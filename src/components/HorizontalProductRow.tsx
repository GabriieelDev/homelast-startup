import ProductCard from "./ProductCard";
import { Product } from "@/data/products";

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
  if (products.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      {/* Mobile: horizontal scroll; md+: grid */}
      <div className="flex md:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {products.map((p) => (
          <div key={p.id} className="min-w-[160px] w-[160px] shrink-0 snap-start">
            <ProductCard
              product={p}
              quantity={getQuantity(p.id)}
              stock={getStock ? getStock(p.id) : 99}
              onAdd={() => onAdd(p)}
              onRemove={() => onRemove(p.id)}
            />
          </div>
        ))}
      </div>
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            quantity={getQuantity(p.id)}
            stock={getStock ? getStock(p.id) : 99}
            onAdd={() => onAdd(p)}
            onRemove={() => onRemove(p.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default HorizontalProductRow;
