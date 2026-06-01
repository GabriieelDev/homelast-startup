import { Home, Package, History, User, ShoppingCart } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  cartCount?: number;
}

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/pedidos", label: "Pedidos", icon: Package },
  { to: "/checkout", label: "Carrinho", icon: ShoppingCart, isCart: true },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/perfil", label: "Perfil", icon: User },
];

const BottomNav = ({ cartCount = 0 }: BottomNavProps) => {
  const { pathname } = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, isCart }) => {
          const active = pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-all duration-300",
                active ? "text-[#00B894] scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 transition-transform duration-300", active && "drop-shadow-[0_0_6px_rgba(0,184,148,0.5)]")} />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00B894] text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pop-in">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
