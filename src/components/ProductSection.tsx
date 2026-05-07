import ProductCard from "./ProductCard";
import { Product } from "@/data/products";

interface ProductSectionProps {
  title: string;
  emoji: string;
  products: Product[];
  getQuantity: (id: string) => number;
  onAdd: (product: Product) => void;
  onRemove: (id: string) => void;
  getStock?: (id: string) => number;
  isAdmin?: boolean;
  onDisableProduct?: (id: string) => void;
}

const ProductSection = ({ title, emoji, products, getQuantity, onAdd, onRemove, getStock, isAdmin, onDisableProduct }: ProductSectionProps) => {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getQuantity(product.id)}
            stock={getStock ? getStock(product.id) : 99}
            onAdd={() => onAdd(product)}
            onRemove={() => onRemove(product.id)}
            isAdmin={isAdmin}
            onDisable={onDisableProduct ? () => onDisableProduct(product.id) : undefined}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductSection;
