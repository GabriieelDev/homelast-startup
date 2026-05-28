import { LogoIcon } from "@/components/Logo";
import { useState, useRef, useMemo, useEffect, useTransition, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/SearchBar";
import CategoryFilters from "@/components/CategoryFilters";
import ProductSection from "@/components/ProductSection";
import FloatingCart from "@/components/FloatingCart";
import Features from "@/components/Features";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, LogOut, Shield, Package, History, User as UserIcon, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderCart from "@/components/HeaderCart";
import BottomNav from "@/components/BottomNav";
import { useUserRole } from "@/hooks/useUserRole";
import { useStock } from "@/hooks/useStock";
import { useDisabledProducts } from "@/hooks/useDisabledProducts";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useProducts } from "@/hooks/useProducts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProductFormDialog from "@/components/admin/ProductFormDialog";
import { isSaleActive } from "@/lib/promotions";
import type { Product } from "@/data/products";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isCourier, loading: roleLoading } = useUserRole();
  const { getStock } = useStock();
  const { isDisabled, disableProduct } = useDisabledProducts();
  const { products } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [, startTransition] = useTransition();
  const handleCategoryChange = useCallback((id: string) => {
    startTransition(() => setCategory(id));
  }, []);
  const handleSearchChange = useCallback((v: string) => {
    startTransition(() => setSearch(v));
  }, []);
  const [showProductForm, setShowProductForm] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const { items, removeItem, getQuantity, totalItems, totalPrice } = cart;
  const addItem = (product: Product) => cart.addItem(product, getStock(product.id));
  useOrderNotifications();

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!roleLoading && isCourier && !isAdmin) {
      navigate("/entregador", { replace: true });
    }
  }, [roleLoading, isCourier, isAdmin, navigate]);

  const filtered = useMemo(() => {
    let list = products;
    if (!isAdmin) {
      list = list.filter((p) => p.active !== false && !isDisabled(p.id));
    }
    if (category === "sale") {
      list = list.filter((p) => isSaleActive(p));
    } else if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }
    if (search.length >= 2) {
      list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [products, category, search, isAdmin, isDisabled]);

  const isFiltering = search.length >= 2 || category !== "all";

  const maisComprados = useMemo(() => filtered.filter((p) => p.section.includes("mais-comprados")), [filtered]);
  const promocoes = useMemo(() => filtered.filter((p) => p.section.includes("promocoes")), [filtered]);
  const recomendados = useMemo(() => filtered.filter((p) => p.section.includes("recomendados")), [filtered]);
  const frequentes = useMemo(() => filtered.filter((p) => p.section.includes("frequentes")), [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <LogoIcon className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-lg text-foreground hidden sm:inline">
              HomeLast Startup
            </span>
          </div>
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <HeaderCart items={items} totalItems={totalItems} totalPrice={totalPrice} onRemove={removeItem} onAdd={addItem} />
            {isAdmin && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-foreground" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-foreground" aria-label="Menu do usuário">
                  <Menu className="h-4 w-4" />
                  <span className="hidden sm:inline">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/perfil")}><UserIcon className="h-4 w-4 mr-2" /> Meu perfil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pedidos")}><Package className="h-4 w-4 mr-2" /> Meus pedidos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/historico")}><History className="h-4 w-4 mr-2" /> Histórico</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/enderecos")}><MapPin className="h-4 w-4 mr-2" /> Endereços</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-3">
          <CategoryFilters active={category} onChange={setCategory} />
        </div>
      </header>

      {!isFiltering && <HeroSection onStart={scrollToProducts} />}

      <div ref={productsRef} className="container mx-auto px-4 py-8 space-y-10 pb-28">
        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={() => setShowProductForm(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar produto
            </Button>
          </div>
        )}
        {isFiltering ? (
          <ProductSection
            title={`Resultados${search ? ` para "${search}"` : ""}`}
            emoji="🔍"
            products={filtered}
            getQuantity={getQuantity}
            getStock={getStock}
            onAdd={addItem}
            onRemove={removeItem}
            isAdmin={isAdmin}
            onDisableProduct={disableProduct}
          />
        ) : (
          <>
            <ProductSection title="Mais comprados" emoji="🔥" products={maisComprados} getQuantity={getQuantity} getStock={getStock} onAdd={addItem} onRemove={removeItem} isAdmin={isAdmin} onDisableProduct={disableProduct} />
            <ProductSection title="Promoções" emoji="🏷️" products={promocoes} getQuantity={getQuantity} getStock={getStock} onAdd={addItem} onRemove={removeItem} isAdmin={isAdmin} onDisableProduct={disableProduct} />
            <ProductSection title="Recomendados" emoji="✨" products={recomendados} getQuantity={getQuantity} getStock={getStock} onAdd={addItem} onRemove={removeItem} isAdmin={isAdmin} onDisableProduct={disableProduct} />
            <ProductSection title="Itens frequentes" emoji="🔄" products={frequentes} getQuantity={getQuantity} getStock={getStock} onAdd={addItem} onRemove={removeItem} isAdmin={isAdmin} onDisableProduct={disableProduct} />
          </>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <p className="text-4xl">😕</p>
            <p className="text-lg font-semibold text-foreground">Nenhum produto encontrado</p>
            <p className="text-muted-foreground">Tente outra busca ou categoria</p>
          </div>
        )}
      </div>

      {!isFiltering && (
        <>
          <Features />
          <CTASection onStart={scrollToProducts} />
        </>
      )}

      <Footer />

      <FloatingCart items={items} totalItems={totalItems} totalPrice={totalPrice} onRemove={removeItem} onAdd={addItem} />
      <BottomNav cartCount={totalItems} />

      {isAdmin && (
        <ProductFormDialog open={showProductForm} onOpenChange={setShowProductForm} />
      )}
    </div>
  );
};

export default Index;
