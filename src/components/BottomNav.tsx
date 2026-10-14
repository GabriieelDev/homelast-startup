import { useEffect, useRef, useState } from "react";
import { Home, Package, History, User, ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { cartDrawer } from "@/hooks/useCartDrawer";
import CartDrawer from "@/components/CartDrawer";

const left = [
  { to: "/", label: "Início", icon: Home },
  { to: "/pedidos", label: "Pedidos", icon: Package },
];
const right = [
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/perfil", label: "Perfil", icon: User },
];

const NavItem = ({ to, label, icon: Icon }: (typeof left)[number]) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      cn(
        "flex flex-col items-center justify-start gap-1 pt-3 min-h-[44px] text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#087A62]",
        isActive ? "text-[#087A62] font-bold" : "text-[#4A5670] font-medium"
      )
    }
  >
    <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
    <span>{label}</span>
  </NavLink>
);

// cartCount prop kept for compatibility; the live count comes from the cart store.
const BottomNav = (_props: { cartCount?: number }) => {
  const { totalItems, totalPrice } = useCart();
  const prev = useRef(totalItems);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (totalItems > prev.current) setBump((b) => b + 1);
    prev.current = totalItems;
  }, [totalItems]);
  const totalLabel = `R$ ${totalPrice.toFixed(2).replace(".", ",")}`;
  const label = `Carrinho, ${totalItems} ${totalItems === 1 ? "item" : "itens"}`;

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E3E7EE] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-[84px]">
          {left.map((i) => <NavItem key={i.to} {...i} />)}

          <div className="relative flex flex-col items-center justify-end pb-2.5">
            <button
              type="button"
              onClick={cartDrawer.open}
              aria-label={label}
              aria-haspopup="dialog"
              className="absolute -top-[34px] left-1/2 -translate-x-1/2 h-[60px] w-[60px] rounded-full bg-[#1D2D50] text-white border-4 border-white shadow-[0_4px_12px_rgba(29,45,80,0.25)] flex items-center justify-center active:scale-95 motion-reduce:active:scale-100 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087A62]"
            >
              <ShoppingCart className="h-[26px] w-[26px]" strokeWidth={1.8} aria-hidden />
              {totalItems > 0 && (
                <span key={bump} className={cn("absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-[#00B894] text-[#06251E] text-xs font-bold border-2 border-white flex items-center justify-center", bump > 0 && "cart-badge-bump")}>
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
            <span className="text-[11px] font-semibold text-[#1D2D50]">{totalItems > 0 ? totalLabel : "Carrinho"}</span>
          </div>

          {right.map((i) => <NavItem key={i.to} {...i} />)}
        </div>
      </nav>
      <CartDrawer />
    </>
  );
};

export default BottomNav;
