import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, Package, ShoppingBag, Boxes, Settings, Zap, ArrowLeft,
  ShieldAlert, ChefHat, Truck, CheckCircle, MapPin, AlertTriangle, TrendingUp,
  Plus, Pencil, Trash2, Power, PowerOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import ProductFormDialog from "@/components/admin/ProductFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Product } from "@/data/products";

type Tab = "dashboard" | "produtos" | "pedidos" | "estoque" | "configuracoes";
type Period = "day" | "week" | "month" | "semester" | "year";

const PERIOD_LABEL: Record<Period, string> = {
  day: "Hoje", week: "7 dias", month: "30 dias", semester: "6 meses", year: "12 meses",
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<Period>("month");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const { products } = useProducts();
  const { settings, save: saveSettings } = useStoreSettings();
  const [draftSettings, setDraftSettings] = useState(settings);
  useEffect(() => { setDraftSettings(settings); }, [settings]);

  const STATUS_FLOW = ["recebido", "preparo", "caminho", "entregue"] as const;
  const STATUS_LABELS: Record<string, string> = {
    recebido: "Pedido recebido", preparo: "Em preparo", caminho: "A caminho", entregue: "Entregue",
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
    load(); loadStock();
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

  const adjustStock = async (productId: string, delta: number) => {
    const current = stockMap[productId] ?? 0;
    await updateStock(productId, Math.max(0, current + delta));
  };

  const periodStart = useMemo(() => {
    const d = new Date();
    if (period === "day") { d.setHours(0, 0, 0, 0); return d; }
    if (period === "week") { d.setDate(d.getDate() - 7); return d; }
    if (period === "month") { d.setDate(d.getDate() - 30); return d; }
    if (period === "semester") { d.setMonth(d.getMonth() - 6); return d; }
    d.setFullYear(d.getFullYear() - 1); return d;
  }, [period]);

  const previousStart = useMemo(() => {
    const span = Date.now() - periodStart.getTime();
    return new Date(periodStart.getTime() - span);
  }, [periodStart]);

  const metrics = useMemo(() => {
    const inPeriod = orders.filter((o) => new Date(o.created_at) >= periodStart);
    const previous = orders.filter((o) => {
      const t = new Date(o.created_at);
      return t >= previousStart && t < periodStart;
    });
    const delivered = inPeriod.filter((o) => o.status === "entregue");
    const revenue = delivered.reduce((s, o) => s + Number(o.total), 0);
    const previousRevenue = previous.filter((o) => o.status === "entregue").reduce((s, o) => s + Number(o.total), 0);
    const ordersCount = inPeriod.length;
    const avgTicket = ordersCount ? revenue / ordersCount : 0;

    const counts: Record<string, number> = {};
    inPeriod.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => { counts[it.id] = (counts[it.id] ?? 0) + Number(it.quantity); });
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, qty]) => ({ id, qty, name: products.find((p) => p.id === id)?.name ?? id }));

    const deliveredAll = orders.filter((o) => o.status === "entregue" && o.created_at && o.updated_at);
    const avgMins = deliveredAll.length
      ? Math.round(deliveredAll.reduce((s, o) => s + (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()) / 60000, 0) / deliveredAll.length)
      : 0;

    const lowStock = products.filter((p) => (stockMap[p.id] ?? 99) > 0 && (stockMap[p.id] ?? 99) <= 5);
    const outOfStock = products.filter((p) => (stockMap[p.id] ?? 99) === 0);

    const variation = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : null;

    // Simple revenue chart (per bucket)
    const buckets = period === "day" ? 24 : period === "week" ? 7 : period === "month" ? 30 : period === "semester" ? 26 : 12;
    const bucketSize = (Date.now() - periodStart.getTime()) / buckets;
    const series = Array.from({ length: buckets }, () => 0);
    delivered.forEach((o) => {
      const idx = Math.min(buckets - 1, Math.floor((new Date(o.created_at).getTime() - periodStart.getTime()) / bucketSize));
      if (idx >= 0) series[idx] += Number(o.total);
    });
    const seriesMax = Math.max(1, ...series);

    return { revenue, ordersCount, avgTicket, top, avgMins, lowStock, outOfStock, variation, series, seriesMax };
  }, [orders, stockMap, products, periodStart, previousStart, period]);

  const advanceStatus = async (order: any) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    const update: any = { status: next };
    if (next === "caminho" && !order.courier_id) {
      const { data: courier } = await supabase.from("couriers").select("user_id").eq("status", "disponivel").limit(1).maybeSingle();
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

  const toggleProductActive = async (p: Product) => {
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    if (error) toast.error("Erro ao atualizar produto");
    else toast.success(p.active ? "Produto desativado" : "Produto ativado");
  };

  const deleteProduct = async (p: Product) => {
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error("Erro ao remover produto");
    else toast.success("Produto removido");
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
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                      <SelectItem key={p} value={p}>{PERIOD_LABEL[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Faturamento</p>
                  <p className="text-2xl font-bold text-foreground">R$ {metrics.revenue.toFixed(2)}</p>
                  {metrics.variation !== null && (
                    <p className={`text-xs font-semibold ${metrics.variation >= 0 ? "text-primary" : "text-destructive"}`}>
                      {metrics.variation >= 0 ? "▲" : "▼"} {Math.abs(metrics.variation).toFixed(1)}% vs anterior
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.ordersCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Ticket médio</p>
                  <p className="text-2xl font-bold text-foreground">R$ {metrics.avgTicket.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Tempo médio entrega</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.avgMins || "—"} min</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-3">Faturamento ({PERIOD_LABEL[period]})</h3>
                <div className="flex items-end gap-1 h-32">
                  {metrics.series.map((v, i) => (
                    <div key={i} className="flex-1 bg-primary/80 rounded-t hover:bg-primary transition-colors" style={{ height: `${(v / metrics.seriesMax) * 100}%`, minHeight: v > 0 ? "4px" : "1px" }} title={`R$ ${v.toFixed(2)}`} />
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-primary" /> Mais vendidos
                  </h3>
                  {metrics.top.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Produtos ({products.length})</h2>
                <Button onClick={() => { setEditingProduct(undefined); setProductFormOpen(true); }} className="gap-2">
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
              <div className="divide-y divide-border">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2.5">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-white" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.name} {!p.active && <span className="text-xs text-muted-foreground">(inativo)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.category} · R$ {p.price.toFixed(2)}</p>
                    </div>
                    <Button size="icon" variant="ghost" title={p.active ? "Desativar" : "Ativar"} onClick={() => toggleProductActive(p)}>
                      {p.active ? <Power className="h-4 w-4 text-primary" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingProduct(p); setProductFormOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover {p.name}?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação é permanente. Para ocultar sem apagar, use desativar.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProduct(p)} className="bg-destructive">Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary font-semibold">{STATUS_LABELS[o.status]}</span>
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
              <p className="text-sm text-muted-foreground">Atualize a quantidade ou use +/- para ajustar rapidamente.</p>
              <div className="divide-y divide-border">
                {products.map((p) => {
                  const current = stockMap[p.id] ?? 0;
                  const draft = editingStock[p.id] ?? String(current);
                  const status = current === 0 ? "esgotado" : current <= 5 ? "baixo" : "ok";
                  return (
                    <div key={p.id} className="flex items-center gap-2 py-2.5">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-white" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs">
                          {status === "esgotado" && <span className="text-destructive font-bold">Esgotado</span>}
                          {status === "baixo" && <span className="text-orange-500 font-bold">Estoque baixo</span>}
                          {status === "ok" && <span className="text-primary">Em estoque</span>}
                        </p>
                      </div>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjustStock(p.id, -1)}>−</Button>
                      <Input
                        type="number" min={0} value={draft}
                        onChange={(e) => setEditingStock((s) => ({ ...s, [p.id]: e.target.value }))}
                        className="w-16 h-8"
                      />
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjustStock(p.id, +1)}>+</Button>
                      <Button size="sm" onClick={() => updateStock(p.id, parseInt(draft, 10))}>Salvar</Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "configuracoes" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const minS = Number(draftSettings.min_shipping);
                const maxS = Number(draftSettings.max_shipping);
                if (maxS < minS) { toast.error("Frete máximo deve ser maior que o mínimo"); return; }
                const err = await saveSettings({
                  name: draftSettings.name,
                  phone: draftSettings.phone,
                  address: draftSettings.address,
                  hours: draftSettings.hours,
                  min_order: Number(draftSettings.min_order),
                  min_shipping: minS,
                  max_shipping: maxS,
                });
                if (err) toast.error("Erro ao salvar"); else toast.success("Configurações salvas ✅");
              }}
              className="space-y-4 max-w-xl"
            >
              <h2 className="text-2xl font-bold text-foreground">Configurações da loja</h2>

              <div className="space-y-3 p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground">Dados do mercado</h3>
                <div className="space-y-1"><Label>Nome</Label><Input value={draftSettings.name} onChange={(e) => setDraftSettings({ ...draftSettings, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>Telefone</Label><Input value={draftSettings.phone} onChange={(e) => setDraftSettings({ ...draftSettings, phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                <div className="space-y-1"><Label>Endereço</Label><Input value={draftSettings.address} onChange={(e) => setDraftSettings({ ...draftSettings, address: e.target.value })} placeholder="Rua, número, bairro, cidade" /></div>
                <div className="space-y-1"><Label>Horário de funcionamento</Label><Input value={draftSettings.hours} onChange={(e) => setDraftSettings({ ...draftSettings, hours: e.target.value })} /></div>
              </div>

              <div className="space-y-3 p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground">Pedido & frete</h3>
                <div className="space-y-1"><Label>Pedido mínimo (R$)</Label><Input type="number" step="0.01" min="0" value={draftSettings.min_order} onChange={(e) => setDraftSettings({ ...draftSettings, min_order: Number(e.target.value) })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Frete mínimo (R$)</Label><Input type="number" step="0.01" min="0" value={draftSettings.min_shipping} onChange={(e) => setDraftSettings({ ...draftSettings, min_shipping: Number(e.target.value) })} /></div>
                  <div className="space-y-1"><Label>Frete máximo (R$)</Label><Input type="number" step="0.01" min="0" value={draftSettings.max_shipping} onChange={(e) => setDraftSettings({ ...draftSettings, max_shipping: Number(e.target.value) })} /></div>
                </div>
              </div>

              <Button type="submit" className="w-full">Salvar configurações</Button>
            </form>
          )}
        </main>
      </div>

      <ProductFormDialog open={productFormOpen} onOpenChange={setProductFormOpen} product={editingProduct} />
    </div>
  );
};

export default Admin;
