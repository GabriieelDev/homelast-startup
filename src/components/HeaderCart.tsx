import { ShoppingCart, Trash2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartItem } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";

interface HeaderCartProps {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  onRemove: (id: string) => void;
  onAdd: (product: CartItem["product"]) => void;
}

const HeaderCart = ({ items, totalItems, totalPrice, onRemove, onAdd }: HeaderCartProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-foreground"
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-cart-bounce">
            {totalItems}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h4 className="font-bold text-sm text-foreground">Carrinho ({totalItems})</h4>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Seu carrinho está vazio
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto p-3 space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2">
                    <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x R$ {item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-foreground shrink-0">
                      R$ {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => onRemove(item.product.id)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onAdd(item.product)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-3 space-y-2">
                <div className="flex items-center justify-between font-bold text-sm text-foreground">
                  <span>Subtotal</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setOpen(false)}>
                    Continuar comprando
                  </Button>
                  <Button size="sm" className="flex-1 text-xs" onClick={() => { setOpen(false); navigate("/checkout", { state: { items, totalPrice } }); }}>
                    Finalizar pedido
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderCart;
