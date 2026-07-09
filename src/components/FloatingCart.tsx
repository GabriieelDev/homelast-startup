import { ShoppingCart, Clock, ChevronUp, X, Trash2, MapPin, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartItem } from "@/hooks/useCart";
import { getEffectivePrice } from "@/lib/promotions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FloatingCartProps {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  onRemove: (id: string) => void;
  onAdd: (product: CartItem["product"]) => void;
}

const FRETE_MIN = 5;
const FRETE_MAX = 15;

const calcFrete = () => {
  const base = Math.random() * 10 + 5;
  return Math.min(Math.max(base, FRETE_MIN), FRETE_MAX);
};

const FloatingCart = ({ items, totalItems, totalPrice, onRemove, onAdd }: FloatingCartProps) => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [defaultAddress, setDefaultAddress] = useState<string | null>(null);
  const [hasAddress, setHasAddress] = useState(false);
  const [frete] = useState(() => Number(calcFrete().toFixed(2)));

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("addresses")
      .select("street, number, neighborhood")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDefaultAddress(`${data.street}, ${data.number} - ${data.neighborhood}`);
          setHasAddress(true);
        } else {
          setHasAddress(false);
        }
      });
  }, [userId]);

  if (totalItems === 0) return null;

  const deliveryMin = 25 + Math.floor(Math.random() * 10);
  const deliveryMax = deliveryMin + 15;

  const handleCheckout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasAddress) {
      navigate("/enderecos", { state: { fromCheckout: true, items, totalPrice, frete } });
    } else {
      navigate("/checkout", { state: { items, totalPrice, frete } });
    }
  };

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 animate-slide-up">
      {expanded && (
        <div className="bg-card border-t border-border shadow-2xl max-h-[60vh] overflow-y-auto mx-auto max-w-xl rounded-t-2xl">
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
            <h3 className="font-bold text-foreground">Seu carrinho</h3>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Address */}
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              {defaultAddress ? (
                <span className="text-foreground truncate">{defaultAddress}</span>
              ) : (
                <button onClick={() => navigate("/enderecos")} className="text-primary hover:underline">
                  Adicionar endereço
                </button>
              )}
              {defaultAddress && (
                <button onClick={() => navigate("/enderecos")} className="text-primary hover:underline text-xs shrink-0">Trocar</button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                  <p className="text-sm text-primary font-semibold">
                    {item.quantity}x R$ {getEffectivePrice(item.product).toFixed(2)}
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

          {/* Delivery info */}
          <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">R$ {totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Frete</span>
              <span className="text-foreground">R$ {frete.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-foreground">
              <span>Total</span>
              <span>R$ {(totalPrice + frete).toFixed(2)}</span>
            </div>
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
              <p className="font-bold text-sm">R$ {(totalPrice + frete).toFixed(2)}</p>
              <div className="flex items-center gap-1 text-xs opacity-80">
                <Clock className="h-3 w-3" />
                Entrega em {deliveryMin}–{deliveryMax} min
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="accent" size="sm" className="rounded-full" onClick={handleCheckout}>
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
