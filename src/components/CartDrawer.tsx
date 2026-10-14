import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { reconcileCartWithStock, useCart } from "@/hooks/useCart";
import { cartDrawer, useCartDrawerOpen } from "@/hooks/useCartDrawer";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { calcShipping } from "@/lib/shipping";
import { getEffectivePrice } from "@/lib/promotions";

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const stepper =
  "h-11 w-11 flex items-center justify-center rounded-full border border-[#E3E7EE] bg-white text-[#1D2D50] active:scale-95 motion-reduce:active:scale-100 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#087A62]";

const CartDrawer = () => {
  const open = useCartDrawerOpen();
  const navigate = useNavigate();
  const { items, addItem, removeItem, totalPrice, stockLimit } = useCart();

  // Re-read stock every time the drawer opens.
  useEffect(() => {
    if (open) void reconcileCartWithStock();
  }, [open]);
  const { settings } = useStoreSettings();
  // Same estimate FloatingCart used; fixed per mount so it doesn't flicker on re-render.
  const [eta] = useState(() => {
    const min = 25 + Math.floor(Math.random() * 10);
    return `${min}–${min + 15}`;
  });

  const handleCheckout = () => {
    cartDrawer.close();
    const frete = calcShipping(totalPrice, settings);
    navigate("/checkout", { state: { items, totalPrice, frete } });
  };

  return (
    <Drawer open={open} onOpenChange={cartDrawer.setOpen} shouldScaleBackground={false}>
      <DrawerContent
        className="max-h-[85vh] rounded-t-[24px] border-0 bg-white p-0 outline-none"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between px-5 pt-1 pb-2 shrink-0">
          <DrawerTitle className="text-lg font-bold text-[#1D2D50]">Meu carrinho</DrawerTitle>
          <DrawerDescription className="sr-only">Itens do seu carrinho</DrawerDescription>
          <button
            onClick={cartDrawer.close}
            aria-label="Fechar carrinho"
            className="h-11 w-11 -mr-2 flex items-center justify-center rounded-full text-[#4A5670] hover:bg-[#F2F4F8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length > 0 && (
          <p className="px-5 pb-2 text-sm text-[#4A5670]">Entrega em {eta} min</p>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <ShoppingBag className="h-12 w-12 text-[#4A5670]" strokeWidth={1.5} />
            <p className="font-semibold text-[#1D2D50]">Seu carrinho está vazio</p>
            <button
              onClick={cartDrawer.close}
              className="w-full max-w-xs h-[52px] rounded-full bg-[#00B894] text-[#06251E] font-bold"
            >
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            <ul
              className="flex-1 overflow-y-auto px-5 divide-y divide-[#E3E7EE]"
              style={{ overscrollBehavior: "contain" }}
            >
              {items.map((item) => (
                <li key={item.product.id} className="flex items-center gap-3 py-3">
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-[#F2F4F8] overflow-hidden">
                    <img src={item.product.image} alt="" className="h-full w-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1D2D50] line-clamp-2">{item.product.name}</p>
                    <p className="text-sm text-[#4A5670]">{brl(getEffectivePrice(item.product))}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <button onClick={() => removeItem(item.product.id)} aria-label={`Diminuir ${item.product.name}`} className={stepper}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[28px] text-center text-sm font-bold text-[#1D2D50]" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem(item.product)}
                        disabled={item.quantity >= stockLimit(item.product.id)}
                        aria-label={`Aumentar ${item.product.name}`}
                        className={`${stepper} disabled:opacity-40 disabled:active:scale-100`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {item.quantity >= stockLimit(item.product.id) && (
                      <p className="mt-0.5 text-xs text-[#4A5670]">Máximo disponível: {stockLimit(item.product.id)}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between self-stretch">
                    <span className="text-sm font-bold text-[#1D2D50]">
                      {brl(getEffectivePrice(item.product) * item.quantity)}
                    </span>
                    <button
                      onClick={() => { for (let i = 0; i < item.quantity; i++) removeItem(item.product.id); }}
                      aria-label={`Remover ${item.product.name}`}
                      className="h-11 w-11 -mr-2 -mb-2 flex items-center justify-center text-[#4A5670] hover:text-destructive"
                    >
                      <Trash2 className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 border-t border-[#E3E7EE] px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#4A5670]">Subtotal</span>
                <span className="text-lg font-bold text-[#1D2D50]">{brl(totalPrice)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full h-[52px] rounded-full bg-[#00B894] text-[#06251E] font-bold text-base active:scale-[0.98] motion-reduce:active:scale-100 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087A62]"
              >
                Finalizar compra
              </button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;
