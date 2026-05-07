import { Plus, Minus, AlertTriangle } from "lucide-react";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  stock?: number;
}

const ProductCard = ({ product, quantity, onAdd, onRemove, stock = 99 }: ProductCardProps) => {
  const unavailable = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;
  const reachedMax = quantity >= stock;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200">
      {discount > 0 && !unavailable && (
        <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          -{discount}%
        </div>
      )}
      {unavailable && (
        <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          Indisponível
        </div>
      )}
      {lowStock && (
        <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Últimas {stock}
        </div>
      )}
      <div className={`aspect-square overflow-hidden bg-white p-2 ${unavailable ? "opacity-50 grayscale" : ""}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-end gap-1.5">
          <span className="text-lg font-bold text-primary">
            R$ {product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              R$ {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <div className="pt-1">
          {unavailable ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-1.5 bg-muted text-muted-foreground rounded-lg py-2.5 font-semibold text-sm cursor-not-allowed"
            >
              Indisponível
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:bg-primary/90 transition-colors active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          ) : (
            <div className="flex items-center justify-between bg-primary/10 rounded-lg overflow-hidden animate-pop-in">
              <button
                onClick={onRemove}
                className="flex items-center justify-center h-10 w-10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-bold text-primary text-sm">{quantity}</span>
              <button
                onClick={onAdd}
                disabled={reachedMax}
                className="flex items-center justify-center h-10 w-10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
