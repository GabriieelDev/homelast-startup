import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, ShoppingBag, Boxes, Settings, Zap, ArrowLeft, ShieldAlert, ChefHat, Truck, CheckCircle, MapPin } from "lucide-react";
import { products } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "dashboard" | "produtos" | "pedidos" | "estoque" | "configuracoes";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4 bg-card border border-border rounded-xl p-8 shadow-sm">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Acesso restrito a administradores</h1>
          <p className="text-muted-foreground">Sua conta não tem permissão para acessar este painel.</p>
          <Button onClick={() => navigate("/")}>Voltar para a loja</Button>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "produtos", label: "Produtos", icon: Package },
    { key: "pedidos", label: "Pedidos", icon: ShoppingBag },
    { key: "estoque", label: "Estoque", icon: Boxes },
    { key: "configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Loja
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">ServBem · Admin</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid md:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium btn-press transition-all ${
                tab === key ? "bg-primary text-primary-foreground shadow" : "text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </aside>

        <main className="bg-card border border-border rounded-xl p-6 min-h-[400px]">
          {tab === "dashboard" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Pedidos hoje</p>
                  <p className="text-2xl font-bold text-foreground">12</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Faturamento</p>
                  <p className="text-2xl font-bold text-foreground">R$ 1.840,00</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Produtos ativos</p>
                  <p className="text-2xl font-bold text-foreground">{products.length}</p>
                </div>
              </div>
            </div>
          )}
          {tab === "produtos" && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
              <div className="divide-y divide-border">
                {products.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">R$ {p.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "pedidos" && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Pedidos</h2>
              <p className="text-muted-foreground text-sm">Nenhum pedido recente.</p>
            </div>
          )}
          {tab === "estoque" && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Estoque</h2>
              <p className="text-muted-foreground text-sm">Controle de estoque em desenvolvimento.</p>
            </div>
          )}
          {tab === "configuracoes" && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
              <p className="text-muted-foreground text-sm">Configurações da loja em desenvolvimento.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;
