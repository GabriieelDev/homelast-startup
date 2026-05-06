import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutDashboard, Package, ShoppingBag, Boxes, Settings, Zap, ArrowLeft, ShieldAlert, ChefHat, Truck, CheckCircle, MapPin, AlertTriangle, TrendingUp } from "lucide-react";
import { products } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "dashboard" | "produtos" | "pedidos" | "estoque" | "configuracoes";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});

  const STATUS_FLOW = ["recebido", "preparo", "caminho", "entregue"] as const;
  const STATUS_LABELS: Record<string, string> = {
    recebido: "Pedido recebido",
    preparo: "Em preparo",
    caminho: "A caminho",
    entregue: "Entregue",
  };
  const STATUS_ICONS: Record<string, any> = { recebido: Package, preparo: ChefHat, caminho: Truck, entregue: CheckCircle };

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      const list = data ?? [];
      setOrders(list);
      const userIds = Array.from(new Set(list.map((o: any) => o.user_id)));
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        const map: Record<string, string> = {};
        (profs ?? []).forEach((p: any) => { map[p.user_id] = p.full_name; });
        setProfilesMap(map);
      }
    };
    const loadStock = async () => {
      const { data } = await supabase.from("product_stock").select("product_id, stock");
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { map[r.product_id] = r.stock; });
      setStockMap(map);
    };
    load();
    loadStock();
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_stock" }, loadStock)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const updateStock = async (productId: string, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) { toast.error("Quantidade inválida"); return; }
    const { error } = await supabase
      .from("product_stock")
      .upsert({ product_id: productId, stock: newStock }, { onConflict: "product_id" });
    if (error) { toast.error("Erro ao atualizar estoque"); return; }
    toast.success("Estoque atualizado");
  };

  // Metrics
  const metrics = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todays = orders.filter((o) => new Date(o.created_at) >= today);
    const revenue = orders.filter((o) => o.status === "entregue").reduce((s, o) => s + Number(o.total), 0);
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => { counts[it.id] = (counts[it.id] ?? 0) + Number(it.quantity); });
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, qty]) => ({ id, qty, name: products.find((p) => p.id === id)?.name ?? id }));
    const delivered = orders.filter((o) => o.status === "entregue" && o.created_at && o.updated_at);
    const avgMins = delivered.length
      ? Math.round(delivered.reduce((s, o) => s + (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()) / 60000, 0) / delivered.length)
      : 0;
    const lowStock = products.filter((p) => (stockMap[p.id] ?? 99) > 0 && (stockMap[p.id] ?? 99) <= 5);
    const outOfStock = products.filter((p) => (stockMap[p.id] ?? 99) === 0);
    return { todayCount: todays.length, revenue, top, avgMins, lowStock, outOfStock };
  }, [orders, stockMap]);

  const advanceStatus = async (order: any) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    const update: any = { status: next };
    if (next === "caminho" && !order.courier_id) {
      const { data: courier } = await supabase
        .from("couriers")
        .select("user_id")
        .eq("status", "disponivel")
        .limit(1)
        .maybeSingle();
      if (courier) {
        update.courier_id = courier.user_id;
        await supabase.from("couriers").update({ status: "em_entrega" }).eq("user_id", courier.user_id);
      }
    }
    if (next === "entregue" && order.courier_id) {
      await supabase.from("couriers").update({ status: "disponivel" }).eq("user_id", order.courier_id);
    }
    const { error } = await supabase.from("orders").update(update).eq("id", order.id);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    toast.success(`Status atualizado para "${STATUS_LABELS[next]}"`);
  };

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
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Pedidos hoje</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.todayCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Faturamento (entregue)</p>
                  <p className="text-2xl font-bold text-foreground">R$ {metrics.revenue.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Tempo médio entrega</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.avgMins || "—"} min</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Estoque baixo</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.lowStock.length + metrics.outOfStock.length}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-primary" /> Mais vendidos
                  </h3>
                  {metrics.top.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem vendas ainda.</p>
                  ) : (
                    <ul className="space-y-2">
                      {metrics.top.map((t, i) => (
                        <li key={t.id} className="flex justify-between text-sm">
                          <span className="text-foreground">{i + 1}. {t.name}</span>
                          <span className="font-bold text-primary">{t.qty} un</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Alerta de estoque
                  </h3>
                  {metrics.lowStock.length + metrics.outOfStock.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tudo em estoque ✓</p>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {metrics.outOfStock.map((p) => (
                        <li key={p.id} className="flex justify-between"><span className="text-foreground">{p.name}</span><span className="text-destructive font-bold">Esgotado</span></li>
                      ))}
                      {metrics.lowStock.map((p) => (
                        <li key={p.id} className="flex justify-between"><span className="text-foreground">{p.name}</span><span className="text-orange-500 font-bold">{stockMap[p.id]} un</span></li>
                      ))}
                    </ul>
                  )}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Pedidos em tempo real</h2>
                <span className="text-xs text-muted-foreground">{orders.length} pedido(s)</span>
              </div>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum pedido recente.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => {
                    const idx = STATUS_FLOW.indexOf(o.status);
                    const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
                    const items = Array.isArray(o.items) ? o.items : [];
                    return (
                      <div key={o.id} className="border border-border rounded-xl p-4 space-y-3 bg-card hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-bold text-foreground">Pedido #{o.order_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {profilesMap[o.user_id] || "Cliente"} ·{" "}
                              {new Date(o.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary font-semibold">
                              {STATUS_LABELS[o.status]}
                            </span>
                            <span className="font-bold text-foreground">R$ {Number(o.total).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><span className="font-semibold text-foreground">Itens:</span>{" "}
                            {items.map((it: any) => `${it.quantity}x ${it.name}`).join(", ")}
                          </p>
                          {o.address && (
                            <p className="flex items-start gap-1">
                              <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                              {o.address.street}, {o.address.number} - {o.address.neighborhood}, {o.address.city}
                            </p>
                          )}
                          <p><span className="font-semibold text-foreground">Pagamento:</span> {o.payment_method}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {STATUS_FLOW.map((s, i) => {
                            const Icon = STATUS_ICONS[s];
                            const done = i <= idx;
                            return (
                              <div key={s} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                <Icon className="h-3 w-3" /> {STATUS_LABELS[s]}
                              </div>
                            );
                          })}
                        </div>

                        {next ? (
                          <Button size="sm" onClick={() => advanceStatus(o)} className="btn-press">
                            Avançar para "{STATUS_LABELS[next]}"
                          </Button>
                        ) : (
                          <p className="text-xs text-primary font-semibold">✓ Pedido finalizado</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {tab === "estoque" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Estoque</h2>
              <p className="text-sm text-muted-foreground">Atualize a quantidade disponível de cada produto.</p>
              <div className="divide-y divide-border">
                {products.map((p) => {
                  const current = stockMap[p.id] ?? 0;
                  const draft = editingStock[p.id] ?? String(current);
                  const status = current === 0 ? "esgotado" : current <= 5 ? "baixo" : "ok";
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2.5">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {status === "esgotado" && <span className="text-destructive font-bold">Esgotado</span>}
                          {status === "baixo" && <span className="text-orange-500 font-bold">Estoque baixo</span>}
                          {status === "ok" && <span className="text-primary">Em estoque</span>}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={draft}
                        onChange={(e) => setEditingStock((s) => ({ ...s, [p.id]: e.target.value }))}
                        className="w-20 h-9"
                      />
                      <Button size="sm" onClick={() => updateStock(p.id, parseInt(draft, 10))} className="btn-press">
                        Salvar
                      </Button>
                    </div>
                  );
                })}
              </div>
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
