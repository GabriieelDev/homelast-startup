import { ShoppingCart, Clock, ChevronUp, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { CartItem } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";

interface FloatingCartProps {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  onRemove: (id: string) => void;
  onAdd: (product: CartItem["product"]) => void;
}

const FloatingCart = ({ items, totalItems, totalPrice, onRemove, onAdd }: FloatingCartProps) => {
  const [expanded, setExpanded] = useState(false);

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      {expanded && (
        <div className="bg-card border-t border-border shadow-2xl max-h-[60vh] overflow-y-auto mx-auto max-w-xl rounded-t-2xl">
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
            <h3 className="font-bold text-foreground">Seu carrinho</h3>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                  <p className="text-sm text-primary font-semibold">
                    {item.quantity}x R$ {item.product.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onRemove(item.product.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onAdd(item.product)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        className="bg-primary text-primary-foreground shadow-2xl shadow-primary/30 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="container mx-auto max-w-xl flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-cart-bounce">
                {totalItems}
              </span>
            </div>
            <div>
              <p className="font-bold text-sm">R$ {totalPrice.toFixed(2)}</p>
              <div className="flex items-center gap-1 text-xs opacity-80">
                <Clock className="h-3 w-3" />
                Entrega em ~28 min
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="accent" size="sm" className="rounded-full" onClick={(e) => { e.stopPropagation(); }}>
              Finalizar pedido
            </Button>
            <ChevronUp className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingCart;
