import { ShoppingCart, Trash2, X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartItem } from "@/hooks/useCart";
import { getEffectivePrice } from "@/lib/promotions";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { calcShipping } from "@/lib/shipping";

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
  const isMobile = useIsMobile();
  const { settings } = useStoreSettings();

  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  const handleCheckout = () => {
    setOpen(false);
    const frete = calcShipping(totalPrice, settings);
    navigate("/checkout", { state: { items, totalPrice, frete } });
  };

  const TriggerButton = (
    <button
      onClick={() => setOpen(!open)}
      aria-label="Abrir carrinho"
      className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-foreground"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-cart-bounce">
          {totalItems}
        </span>
      )}
    </button>
  );

  // ----- MOBILE: bottom sheet -----
  if (isMobile) {
    return (
      <>
        {TriggerButton}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerPortal>
            <DrawerOverlay className="bg-black/50" />
            <DrawerContent className="max-h-[75vh] rounded-t-2xl border-0 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] bg-white p-0 flex flex-col focus:outline-none">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0">
                <h3 className="font-bold text-base text-foreground">Meu carrinho</h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-4">
                  <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-medium">Seu carrinho está vazio</p>
                  <Button
                    variant="accent"
                    className="w-full max-w-xs"
                    onClick={() => { setOpen(false); navigate("/"); }}
                  >
                    Explorar produtos
                  </Button>
                </div>
              ) : (
                <>
                  {/* Scrollable items */}
                  <div
                    className="flex-1 overflow-y-auto px-4 pb-4 space-y-3"
                    style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
                  >
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 p-3 min-h-[80px] bg-white border border-border rounded-[10px] animate-fade-in"
                      >
                        {/* Image */}
                        <div className="shrink-0 h-16 w-16 max-[360px]:h-12 max-[360px]:w-12 rounded-lg bg-[#F5F5F5] flex items-center justify-center overflow-hidden">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>

                        {/* Center */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-snug break-words line-clamp-2">
                            {item.product.name}
                          </p>
                          <p className="text-[13px] text-muted-foreground mt-0.5">
                            R$ {getEffectivePrice(item.product).toFixed(2)} un.
                          </p>
                        </div>

                        {/* Right */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onRemove(item.product.id)}
                              aria-label="Diminuir"
                              className="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-white text-foreground hover:bg-secondary active:scale-95 transition"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[20px] text-center text-sm font-semibold text-primary">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onAdd(item.product)}
                              aria-label="Aumentar"
                              className="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-white text-foreground hover:bg-secondary active:scale-95 transition"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-accent">
                            R$ {(getEffectivePrice(item.product) * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => {
                              // remove all of this item
                              for (let i = 0; i < item.quantity; i++) onRemove(item.product.id);
                            }}
                            aria-label="Remover"
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer (fixed inside panel) */}
                  <div className="shrink-0 border-t border-border bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <span className="text-base font-bold text-foreground">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                    <Button variant="accent" className="w-full h-12 text-sm font-semibold" onClick={handleCheckout}>
                      Finalizar pedido
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-12 text-sm font-semibold border-primary text-primary hover:bg-primary/5"
                      onClick={() => setOpen(false)}
                    >
                      Continuar comprando
                    </Button>
                  </div>
                </>
              )}
            </DrawerContent>
          </DrawerPortal>
        </Drawer>
      </>
    );
  }

  // ----- DESKTOP: dropdown (unchanged) -----
  return (
    <div className="relative" ref={ref}>
      {TriggerButton}

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
                        {item.quantity}x R$ {getEffectivePrice(item.product).toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-foreground shrink-0">
                      R$ {(getEffectivePrice(item.product) * item.quantity).toFixed(2)}
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
                  <Button size="sm" className="flex-1 text-xs" onClick={handleCheckout}>
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
