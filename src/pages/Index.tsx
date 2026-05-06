import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/SearchBar";
import CategoryFilters from "@/components/CategoryFilters";
import ProductSection from "@/components/ProductSection";
import FloatingCart from "@/components/FloatingCart";
import Features from "@/components/Features";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { products } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, MapPin, LogOut, Shield, Package, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderCart from "@/components/HeaderCart";
import { useUserRole } from "@/hooks/useUserRole";
import { useStock } from "@/hooks/useStock";
import { useEffect } from "react";
import type { Product } from "@/data/products";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isCourier, loading: roleLoading } = useUserRole();
  const { getStock } = useStock();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const productsRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const { items, removeItem, getQuantity, totalItems, totalPrice } = cart;
  const addItem = (product: Product) => cart.addItem(product, getStock(product.id));

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
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }
    if (search.length >= 2) {
      list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [category, search]);

  const isFiltering = search.length >= 2 || category !== "all";

  const maisComprados = useMemo(() => filtered.filter((p) => p.section.includes("mais-comprados")), [filtered]);
  const promocoes = useMemo(() => filtered.filter((p) => p.section.includes("promocoes")), [filtered]);
  const recomendados = useMemo(() => filtered.filter((p) => p.section.includes("recomendados")), [filtered]);
  const frequentes = useMemo(() => filtered.filter((p) => p.section.includes("frequentes")), [filtered]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-lg text-foreground hidden sm:inline">
              ServBem Supermercado
            </span>
          </div>
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <HeaderCart items={items} totalItems={totalItems} totalPrice={totalPrice} onRemove={removeItem} onAdd={addItem} />
            {isAdmin && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-foreground" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5 text-foreground" onClick={() => navigate("/pedidos")}>
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-foreground" onClick={() => navigate("/enderecos")}>
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Endereços</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-foreground" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-3">
          <CategoryFilters active={category} onChange={setCategory} />
        </div>
      </header>

      {/* Hero - only show when not filtering */}
      {!isFiltering && <HeroSection onStart={scrollToProducts} />}

      {/* Products Feed */}
      <div ref={productsRef} className="container mx-auto px-4 py-8 space-y-10 pb-28">
        {isFiltering ? (
          <ProductSection
            title={`Resultados${search ? ` para "${search}"` : ""}`}
            emoji="🔍"
            products={filtered}
            getQuantity={getQuantity}
            onAdd={addItem}
            onRemove={removeItem}
          />
        ) : (
          <>
            <ProductSection title="Mais comprados" emoji="🔥" products={maisComprados} getQuantity={getQuantity} getStock={getStock} onAdd={addItem} onRemove={removeItem} />
            <ProductSection title="Promoções" emoji="🏷️" products={promocoes} getQuantity={getQuantity} getStock={getStock} onAdd={addItem} onRemove={removeItem} />
            <ProductSection title="Recomendados" emoji="✨" products={recomendados} getQuantity={getQuantity} getStock={getStock} onAdd={addItem} onRemove={removeItem} />
            <ProductSection title="Itens frequentes" emoji="🔄" products={frequentes} getQuantity={getQuantity} getStock={getStock} onAdd={addItem} onRemove={removeItem} />
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

      <FloatingCart
        items={items}
        totalItems={totalItems}
        totalPrice={totalPrice}
        onRemove={removeItem}
        onAdd={addItem}
      />
    </div>
  );
};

export default Index;
