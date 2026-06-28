import { LogoIcon } from "@/components/Logo";
import { useState, useRef, useMemo, useEffect, useTransition, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HeroCarousel from "@/components/HeroCarousel";
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
import { useProducts, useInfiniteProducts } from "@/hooks/useProducts";
import { Loader2 } from "lucide-react";
import { useTopSellers } from "@/hooks/useTopSellers";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProductFormDialog from "@/components/admin/ProductFormDialog";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import HorizontalProductRow from "@/components/HorizontalProductRow";
import { isSaleActive } from "@/lib/promotions";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import type { Product } from "@/data/products";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isCourier, loading: roleLoading } = useUserRole();
  const { getStock } = useStock();
  const { isDisabled, disableProduct } = useDisabledProducts();
  const { products } = useProducts();
  const { url: avatarSrc } = useUserAvatar();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const {
    products: infiniteProducts,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(category);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const handleCategoryChange = useCallback((id: string) => {
    startTransition(() => setCategory(id));
  }, []);
  const handleSearchChange = useCallback((v: string) => {
    startTransition(() => setSearch(v));
  }, []);
  const go = useCallback((path: string) => {
    // Deferred route change keeps the click responsive (better INP).
    startTransition(() => navigate(path));
  }, [navigate]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const { topIds } = useTopSellers(6);
  const { ids: recentIds } = useRecentlyViewed();
  const openProductDetail = useCallback((id: string) => {
    const p = products.find((pp) => pp.id === id);
    if (p) setDetailProduct(p);
  }, [products]);
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

  // Infinite-scrolled list used when filtering by category/search.
  const infiniteFiltered = useMemo(() => {
    let list = infiniteProducts;
    if (!isAdmin) {
      list = list.filter((p) => p.active !== false && !isDisabled(p.id));
    }
    if (category === "sale") {
      list = list.filter((p) => isSaleActive(p));
    }
    if (search.length >= 2) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [infiniteProducts, category, search, isAdmin, isDisabled]);

  // Auto-load next page when sentinel is visible.
  useEffect(() => {
    if (!isFiltering) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isFiltering, hasNextPage, isFetchingNextPage, fetchNextPage, infiniteFiltered.length]);

  const maisComprados = useMemo(() => filtered.filter((p) => p.section.includes("mais-comprados")), [filtered]);
  const promocoes = useMemo(() => filtered.filter((p) => p.section.includes("promocoes")), [filtered]);
  const recomendados = useMemo(() => filtered.filter((p) => p.section.includes("recomendados")), [filtered]);
  const frequentes = useMemo(() => filtered.filter((p) => p.section.includes("frequentes")), [filtered]);

  const visibleProducts = useMemo(
    () => products.filter((p) => p.active !== false && !isDisabled(p.id)),
    [products, isDisabled]
  );
  const topSellersProducts = useMemo(() => {
    return topIds
      .map((id) => visibleProducts.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }, [topIds, visibleProducts]);
  const recentlyViewedProducts = useMemo(() => {
    return recentIds
      .map((id) => visibleProducts.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }, [recentIds, visibleProducts]);

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
            <SearchBar value={search} onChange={handleSearchChange} />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <HeaderCart items={items} totalItems={totalItems} totalPrice={totalPrice} onRemove={removeItem} onAdd={addItem} />
            {isAdmin && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-foreground" onClick={() => go("/admin")}>
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-foreground pl-1.5" aria-label="Menu do usuário">
                  <span className="h-7 w-7 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-border">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-primary" />
                    )}
                  </span>
                  <span className="hidden sm:inline">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go("/perfil")}><UserIcon className="h-4 w-4 mr-2" /> Meu perfil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("/pedidos")}><Package className="h-4 w-4 mr-2" /> Meus pedidos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("/historico")}><History className="h-4 w-4 mr-2" /> Histórico</DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("/enderecos")}><MapPin className="h-4 w-4 mr-2" /> Endereços</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-3">
          <CategoryFilters active={category} onChange={handleCategoryChange} />
        </div>
      </header>

      {!isFiltering && <HeroCarousel onStart={scrollToProducts} onProductClick={openProductDetail} />}

      {!isFiltering && (
        <div className="container mx-auto px-4 pt-6 space-y-8">
          {topSellersProducts.length > 0 && (
            <HorizontalProductRow
              title="Mais vendidos"
              emoji="🔥"
              products={topSellersProducts}
              getQuantity={getQuantity}
              getStock={getStock}
              onAdd={addItem}
              onRemove={removeItem}
            />
          )}
          {user && recentlyViewedProducts.length > 0 && (
            <HorizontalProductRow
              title="Vistos recentemente"
              emoji="👁️"
              products={recentlyViewedProducts}
              getQuantity={getQuantity}
              getStock={getStock}
              onAdd={addItem}
              onRemove={removeItem}
            />
          )}
        </div>
      )}

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

      <ProductDetailDialog
        product={detailProduct}
        open={Boolean(detailProduct)}
        onOpenChange={(o) => { if (!o) setDetailProduct(null); }}
        stock={detailProduct ? getStock(detailProduct.id) : 0}
        quantity={detailProduct ? getQuantity(detailProduct.id) : 0}
        onAdd={() => { if (detailProduct) addItem(detailProduct); }}
        onRemove={() => { if (detailProduct) removeItem(detailProduct.id); }}
      />
    </div>
  );
};

export default Index;
