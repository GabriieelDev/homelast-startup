import { LogoIcon } from "@/components/Logo";
import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, Package, ShoppingBag, Boxes, Settings, ArrowLeft,
  ShieldAlert, ChefHat, Truck, CheckCircle, MapPin, AlertTriangle, TrendingUp,
  Plus, Pencil, Trash2, Power, PowerOff, DollarSign, FileText, Download, FileSpreadsheet, Printer,
  Bell, BellOff, Clock, TrendingDown, PackageX,
  Instagram, Facebook, MessageCircle, Music2, GripVertical, Tag, FileInput,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";
import { useDisabledProducts } from "@/hooks/useDisabledProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import ProductFormDialog from "@/components/admin/ProductFormDialog";
import CategoryManager from "@/components/admin/CategoryManager";
import NfeImporter from "@/components/admin/NfeImporter";
import SalePromotionsPanel from "@/components/admin/SalePromotionsPanel";
import CarouselManager from "@/components/admin/CarouselManager";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Product } from "@/data/products";
import { downloadCSV, downloadExcelXML, openPrintableReport } from "@/lib/reports";

type Tab = "dashboard" | "produtos" | "categorias" | "nfe" | "promocoes" | "pedidos" | "estoque" | "alertas" | "financeiro" | "relatorios" | "configuracoes";
type Period = "day" | "week" | "month" | "semester" | "year";

const PERIOD_LABEL: Record<Period, string> = {
  day: "Hoje", week: "7 dias", month: "30 dias", semester: "6 meses", year: "12 meses",
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [, startTabTransition] = useTransition();
  const handleTabChange = useCallback((key: Tab) => {
    // Defer heavy panel render so the click feels instant (better INP).
    startTabTransition(() => setTab(key));
  }, []);
  const [orders, setOrders] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<Period>("month");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const { products } = useProducts();
  const { disabledIds, enableProduct } = useDisabledProducts();
  const { settings, loading: settingsLoading, save: saveSettings } = useStoreSettings();
  const [draftSettings, setDraftSettings] = useState(settings);
  useEffect(() => {
    if (!settingsLoading) setDraftSettings(settings);
  }, [settings, settingsLoading]);

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

  // ---- Financeiro: lucro por pedido baseado em cost_price ----
  const productCostMap = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p) => { m[p.id] = p.costPrice ?? 0; });
    return m;
  }, [products]);

  const financial = useMemo(() => {
    const inPeriod = orders.filter((o) => new Date(o.created_at) >= periodStart && o.status === "entregue");
    let revenue = 0, cogs = 0;
    const byProduct: Record<string, { name: string; qty: number; revenue: number; cost: number }> = {};
    inPeriod.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        const qty = Number(it.quantity) || 0;
        const lineRev = Number(it.price) * qty;
        const lineCost = (productCostMap[it.id] ?? 0) * qty;
        revenue += lineRev;
        cogs += lineCost;
        if (!byProduct[it.id]) byProduct[it.id] = { name: it.name, qty: 0, revenue: 0, cost: 0 };
        byProduct[it.id].qty += qty;
        byProduct[it.id].revenue += lineRev;
        byProduct[it.id].cost += lineCost;
      });
    });
    const profit = revenue - cogs;
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
    const topProfit = Object.entries(byProduct)
      .map(([id, v]) => ({ id, ...v, profit: v.revenue - v.cost, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0 }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
    return { revenue, cogs, profit, marginPct, topProfit, ordersCount: inPeriod.length };
  }, [orders, productCostMap, periodStart]);

  // ---- Alertas configuráveis ----
  type AlertItem = {
    id: string;
    kind: "stock_out" | "stock_low" | "order_late" | "sales_drop";
    severity: "high" | "medium" | "low";
    title: string;
    detail: string;
  };
  const alerts = useMemo<AlertItem[]>(() => {
    if (!settings.alerts_enabled) return [];
    const list: AlertItem[] = [];
    const lowT = settings.low_stock_threshold;
    const lateT = settings.late_order_minutes;
    const dropT = settings.sales_drop_pct;

    products.forEach((p) => {
      const s = stockMap[p.id] ?? 99;
      if (s === 0) {
        list.push({ id: `out-${p.id}`, kind: "stock_out", severity: "high",
          title: `${p.name} esgotado`, detail: `Produto sem estoque — indisponível na loja.` });
      } else if (s <= lowT) {
        list.push({ id: `low-${p.id}`, kind: "stock_low", severity: "medium",
          title: `${p.name} com estoque baixo`, detail: `Restam ${s} un (limite: ${lowT}).` });
      }
    });

    const now = Date.now();
    orders.forEach((o) => {
      if (o.status === "entregue" || o.status === "cancelado") return;
      const mins = Math.floor((now - new Date(o.created_at).getTime()) / 60000);
      if (mins >= lateT) {
        list.push({ id: `late-${o.id}`, kind: "order_late", severity: "high",
          title: `Pedido #${o.order_number} atrasado`, detail: `Aberto há ${mins} min (limite: ${lateT}).` });
      }
    });

    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const startYesterday = new Date(startToday); startYesterday.setDate(startYesterday.getDate() - 1);
    const sumRange = (from: Date, to: Date) => orders
      .filter((o) => o.status === "entregue" && new Date(o.created_at) >= from && new Date(o.created_at) < to)
      .reduce((s, o) => s + Number(o.total), 0);
    const today = sumRange(startToday, new Date(now));
    const yesterday = sumRange(startYesterday, startToday);
    if (yesterday > 0) {
      const dropPct = ((yesterday - today) / yesterday) * 100;
      if (dropPct >= dropT) {
        list.push({ id: "sales-drop", kind: "sales_drop", severity: "medium",
          title: "Queda de vendas hoje", detail: `Hoje R$ ${today.toFixed(2)} vs ontem R$ ${yesterday.toFixed(2)} (-${dropPct.toFixed(0)}%, limite: ${dropT}%).` });
      }
    }

    const order = { high: 0, medium: 1, low: 2 } as const;
    return list.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [products, stockMap, orders, settings]);

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

  const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "produtos", label: "Produtos", icon: Package },
    { key: "categorias", label: "Categorias", icon: Tag },
    { key: "nfe", label: "Importar NF-e", icon: FileInput },
    { key: "promocoes", label: "Promoções", icon: Tag },
    { key: "pedidos", label: "Pedidos", icon: ShoppingBag },
    { key: "estoque", label: "Estoque", icon: Boxes },
    { key: "alertas", label: "Alertas", icon: Bell, badge: alerts.length },
    { key: "financeiro", label: "Financeiro", icon: DollarSign },
    { key: "relatorios", label: "Relatórios", icon: FileText },
    { key: "configuracoes", label: "Configurações", icon: Settings },
  ];

  // ---- Relatórios: builders ----
  const buildSalesRows = () => orders
    .filter((o) => new Date(o.created_at) >= periodStart && o.status === "entregue")
    .map((o) => ({
      pedido: o.order_number,
      data: new Date(o.created_at).toLocaleString("pt-BR"),
      cliente: profilesMap[o.user_id] || "—",
      itens: (Array.isArray(o.items) ? o.items : []).reduce((s: number, it: any) => s + Number(it.quantity), 0),
      subtotal: Number(o.subtotal).toFixed(2),
      frete: Number(o.shipping).toFixed(2),
      total: Number(o.total).toFixed(2),
      pagamento: o.payment_method,
    }));

  const buildOrdersRows = () => orders.map((o) => ({
    pedido: o.order_number,
    data: new Date(o.created_at).toLocaleString("pt-BR"),
    status: STATUS_LABELS[o.status] ?? o.status,
    cliente: profilesMap[o.user_id] || "—",
    itens: (Array.isArray(o.items) ? o.items : []).map((it: any) => `${it.quantity}x ${it.name}`).join(" | "),
    total: Number(o.total).toFixed(2),
    pagamento: o.payment_method,
  }));

  const buildProductsRows = () => {
    const counts: Record<string, { qty: number; revenue: number }> = {};
    orders.filter((o) => new Date(o.created_at) >= periodStart && o.status === "entregue").forEach((o) => {
      (Array.isArray(o.items) ? o.items : []).forEach((it: any) => {
        const qty = Number(it.quantity) || 0;
        if (!counts[it.id]) counts[it.id] = { qty: 0, revenue: 0 };
        counts[it.id].qty += qty;
        counts[it.id].revenue += Number(it.price) * qty;
      });
    });
    return products.map((p) => {
      const c = counts[p.id] ?? { qty: 0, revenue: 0 };
      const cost = (p.costPrice ?? 0) * c.qty;
      return {
        produto: p.name,
        categoria: p.category,
        preco: p.price.toFixed(2),
        custo: (p.costPrice ?? 0).toFixed(2),
        margem_pct: p.costPrice && p.price ? (((p.price - p.costPrice) / p.price) * 100).toFixed(1) : "—",
        vendidos: c.qty,
        receita: c.revenue.toFixed(2),
        lucro: (c.revenue - cost).toFixed(2),
        estoque: stockMap[p.id] ?? 0,
        ativo: p.active ? "sim" : "não",
      };
    }).sort((a, b) => Number(b.vendidos) - Number(a.vendidos));
  };

  const buildStockRows = () => products.map((p) => {
    const s = stockMap[p.id] ?? 0;
    return {
      produto: p.name,
      categoria: p.category,
      estoque: s,
      status: s === 0 ? "Esgotado" : s <= 5 ? "Baixo" : "OK",
    };
  });

  const buildClientsRows = () => {
    const map: Record<string, { name: string; orders: number; total: number }> = {};
    orders.forEach((o) => {
      const id = o.user_id;
      if (!map[id]) map[id] = { name: profilesMap[id] || "—", orders: 0, total: 0 };
      map[id].orders += 1;
      map[id].total += Number(o.total);
    });
    return Object.values(map).map((c) => ({
      cliente: c.name,
      pedidos: c.orders,
      total_gasto: c.total.toFixed(2),
      ticket_medio: (c.total / c.orders).toFixed(2),
    })).sort((a, b) => Number(b.total_gasto) - Number(a.total_gasto));
  };

  const REPORTS = [
    { key: "vendas", title: "Vendas", build: buildSalesRows, sub: PERIOD_LABEL[period] },
    { key: "pedidos", title: "Pedidos", build: buildOrdersRows, sub: "Todos os pedidos" },
    { key: "produtos", title: "Produtos & lucratividade", build: buildProductsRows, sub: PERIOD_LABEL[period] },
    { key: "estoque", title: "Estoque", build: buildStockRows, sub: "Snapshot atual" },
    { key: "clientes", title: "Clientes", build: buildClientsRows, sub: "Histórico completo" },
  ];


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Loja
          </Button>
          <div className="flex items-center gap-2">
            <LogoIcon className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">HomeLast · Admin</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid md:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-1">
          {tabs.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium btn-press transition-all ${
                tab === key ? "bg-primary text-primary-foreground shadow" : "text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{label}</span>
              {badge && badge > 0 ? (
                <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  tab === key ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground"
                }`}>{badge}</span>
              ) : null}
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

              {/* Disabled products section — items removed via storefront "trash" action */}
              {(() => {
                const disabledList = products.filter((p) => disabledIds.has(p.id));
                if (disabledList.length === 0) return null;
                return (
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-2">
                      <PowerOff className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-bold text-foreground">
                        Produtos desativados ({disabledList.length})
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Estes produtos foram removidos do catálogo. Reative para voltar à vitrine imediatamente.
                    </p>
                    <div className="divide-y divide-border border border-dashed border-border rounded-lg">
                      {disabledList.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 py-2.5 px-3 opacity-60 hover:opacity-100 transition-opacity">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-white grayscale"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                              {p.name}
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">Inativo</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{p.category} · R$ {p.price.toFixed(2)}</p>
                          </div>
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => enableProduct(p.id)}>
                            <Power className="h-3.5 w-3.5 text-primary" /> Reativar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {tab === "categorias" && <CategoryManager />}

          {tab === "nfe" && <NfeImporter />}

          {tab === "promocoes" && <SalePromotionsPanel />}

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

          {tab === "alertas" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Bell className="h-6 w-6 text-primary" /> Alertas
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {settings.alerts_enabled
                      ? `${alerts.length} alerta(s) ativo(s) com base nas suas regras.`
                      : "Alertas desativados nas configurações."}
                  </p>
                </div>
                <Button
                  variant={settings.alerts_enabled ? "outline" : "default"}
                  className="gap-2"
                  onClick={async () => {
                    const err = await saveSettings({ alerts_enabled: !settings.alerts_enabled } as any);
                    if (err) toast.error("Erro ao atualizar"); else toast.success(settings.alerts_enabled ? "Alertas desativados" : "Alertas ativados");
                  }}
                >
                  {settings.alerts_enabled ? <><BellOff className="h-4 w-4" /> Desativar</> : <><Bell className="h-4 w-4" /> Ativar</>}
                </Button>
              </div>

              <div className="space-y-2">
                {!settings.alerts_enabled ? (
                  <div className="p-6 rounded-lg border border-dashed border-border text-center text-muted-foreground">
                    Ative os alertas para começar a receber notificações.
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="p-6 rounded-lg border border-dashed border-border text-center text-muted-foreground">
                    🎉 Nenhum alerta no momento. Tudo certo!
                  </div>
                ) : (
                  alerts.map((a) => {
                    const Icon = a.kind === "stock_out" ? PackageX
                      : a.kind === "stock_low" ? AlertTriangle
                      : a.kind === "order_late" ? Clock
                      : TrendingDown;
                    const tone = a.severity === "high"
                      ? "bg-destructive/10 border-destructive/40"
                      : "bg-orange-500/10 border-orange-500/40";
                    return (
                      <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${tone}`}>
                        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${a.severity === "high" ? "text-destructive" : "text-orange-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.detail}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const err = await saveSettings({
                    low_stock_threshold: Number(draftSettings.low_stock_threshold),
                    late_order_minutes: Number(draftSettings.late_order_minutes),
                    sales_drop_pct: Number(draftSettings.sales_drop_pct),
                  } as any);
                  if (err) toast.error("Erro ao salvar"); else toast.success("Regras de alerta salvas ✅");
                }}
                className="space-y-4 p-4 rounded-lg border border-border"
              >
                <h3 className="font-semibold text-foreground">Regras configuráveis</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Estoque baixo (≤ un)</Label>
                    <Input type="number" min="1" value={draftSettings.low_stock_threshold}
                      onChange={(e) => setDraftSettings({ ...draftSettings, low_stock_threshold: Number(e.target.value) })} />
                    <p className="text-[11px] text-muted-foreground">Avisar quando produto chega nesse nível.</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Pedido atrasado (min)</Label>
                    <Input type="number" min="5" value={draftSettings.late_order_minutes}
                      onChange={(e) => setDraftSettings({ ...draftSettings, late_order_minutes: Number(e.target.value) })} />
                    <p className="text-[11px] text-muted-foreground">Pedido aberto há mais que isso vira alerta.</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Queda de vendas (%)</Label>
                    <Input type="number" min="1" max="100" value={draftSettings.sales_drop_pct}
                      onChange={(e) => setDraftSettings({ ...draftSettings, sales_drop_pct: Number(e.target.value) })} />
                    <p className="text-[11px] text-muted-foreground">Comparativo hoje vs ontem.</p>
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto">Salvar regras</Button>
              </form>
            </div>
          )}

          {tab === "financeiro" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-foreground">Financeiro & Lucro</h2>
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
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <p className="text-2xl font-bold text-foreground">R$ {financial.revenue.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Custo (CMV)</p>
                  <p className="text-2xl font-bold text-foreground">R$ {financial.cogs.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground">Lucro estimado</p>
                  <p className="text-2xl font-bold text-primary">R$ {financial.profit.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Margem média</p>
                  <p className="text-2xl font-bold text-foreground">{financial.marginPct.toFixed(1)}%</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-3">Top 5 produtos mais lucrativos</h3>
                {financial.topProfit.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sem dados. Cadastre o <strong>preço de custo</strong> em cada produto para visualizar lucro.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {financial.topProfit.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{i + 1}. {p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.qty} un · margem {p.margin.toFixed(1)}%</p>
                        </div>
                        <span className="font-bold text-primary">R$ {p.profit.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm text-foreground">
                💡 Os cálculos de lucro consideram apenas pedidos <strong>entregues</strong> no período e o
                preço de custo cadastrado em cada produto. Edite produtos para definir o custo.
              </div>
            </div>
          )}

          {tab === "relatorios" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                      <SelectItem key={p} value={p}>{PERIOD_LABEL[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-muted-foreground">
                Exporte os dados da loja em CSV (planilhas/Sheets), Excel (.xls) ou PDF (via impressão do navegador).
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                {REPORTS.map((r) => (
                  <div key={r.key} className="p-4 rounded-lg border border-border space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{r.title}</h3>
                      <p className="text-xs text-muted-foreground">{r.sub}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5"
                        onClick={() => downloadCSV(`${r.key}-${Date.now()}.csv`, r.build())}>
                        <Download className="h-3.5 w-3.5" /> CSV
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5"
                        onClick={() => downloadExcelXML(`${r.key}-${Date.now()}.xls`, r.build(), r.title)}>
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5"
                        onClick={() => openPrintableReport(r.title, r.build(), r.sub)}>
                        <Printer className="h-3.5 w-3.5" /> PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "configuracoes" && (
            settingsLoading ? (
              <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                Carregando configurações salvas...
              </div>
            ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const minS = Number(draftSettings.min_shipping);
                const maxS = Number(draftSettings.max_shipping);
                if (maxS < minS) { toast.error("Frete máximo deve ser maior que o mínimo"); return; }
                // Validate social URLs
                const PLATFORM_LABEL: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp", tiktok: "TikTok" };
                const invalid = (draftSettings.social_links || []).find((l) => {
                  if (!l.url?.trim()) return false;
                  if (l.platform === "whatsapp") {
                    const isPhone = /^\+?\d[\d\s().-]{7,}$/.test(l.url.trim());
                    const isLink = /^https?:\/\/(wa\.me|api\.whatsapp\.com)/i.test(l.url.trim());
                    return !isPhone && !isLink;
                  }
                  try {
                    const u = /^https?:\/\//i.test(l.url) ? l.url : `https://${l.url}`;
                    new URL(u);
                    return false;
                  } catch { return true; }
                });
                if (invalid) { toast.error(`Link inválido para ${PLATFORM_LABEL[invalid.platform] ?? invalid.platform}`); return; }

                const err = await saveSettings({
                  name: draftSettings.name,
                  phone: draftSettings.phone,
                  address: draftSettings.address,
                  hours: draftSettings.hours,
                  min_order: Number(draftSettings.min_order),
                  min_shipping: minS,
                  max_shipping: maxS,
                  social_links: (draftSettings.social_links || []).map((l, i) => ({ ...l, order: i })),
                } as any);
                if (err) toast.error(err.message || "Erro ao salvar"); else toast.success("Configurações salvas ✅");

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

              <div className="space-y-3 p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Redes sociais</h3>
                  <span className="text-xs text-muted-foreground">Aparecem no rodapé, sobre nós e confirmação de pedido</span>
                </div>
                {(["instagram", "facebook", "whatsapp", "tiktok"] as const).map((platform) => {
                  const links = draftSettings.social_links || [];
                  const link = links.find((l) => l.platform === platform) || { platform, url: "", enabled: false, order: links.length };
                  const Icon = platform === "instagram" ? Instagram : platform === "facebook" ? Facebook : platform === "whatsapp" ? MessageCircle : Music2;
                  const placeholder = platform === "whatsapp" ? "(11) 99999-9999 ou wa.me/55..." : `https://${platform}.com/seuperfil`;
                  const update = (patch: Partial<typeof link>) => {
                    const merged = { ...link, ...patch };
                    // Auto-enable when a URL is provided; auto-disable when cleared
                    if (patch.url !== undefined) {
                      merged.enabled = !!patch.url.trim();
                    }
                    const next = [...links.filter((l) => l.platform !== platform), merged];
                    setDraftSettings({ ...draftSettings, social_links: next.map((l, i) => ({ ...l, order: i })) });
                  };
                  return (
                    <div key={platform} className="flex items-center gap-2 p-2 rounded-md border border-border">
                      <Icon className="h-5 w-5 text-primary shrink-0" />
                      <Input
                        value={link.url}
                        onChange={(e) => update({ url: e.target.value })}
                        placeholder={placeholder}
                        className="flex-1 h-9"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant={link.enabled ? "default" : "outline"}
                        className="gap-1.5 shrink-0"
                        disabled={!link.url?.trim()}
                        onClick={() => update({ enabled: !link.enabled })}
                      >
                        {link.enabled ? <><Power className="h-3.5 w-3.5" /> Ativo</> : <><PowerOff className="h-3.5 w-3.5" /> Inativo</>}
                      </Button>
                    </div>
                  );
                })}
                <p className="text-[11px] text-muted-foreground">Preencha a URL e o ícone aparecerá automaticamente no rodapé.</p>

              </div>

              <Button type="submit" className="w-full">Salvar configurações</Button>
            </form>
            )
          )}

          {tab === "configuracoes" && (
            <div className="mt-8 pt-8 border-t border-border">
              <CarouselManager />
            </div>
          )}
        </main>
      </div>

      <ProductFormDialog open={productFormOpen} onOpenChange={setProductFormOpen} product={editingProduct} />
    </div>
  );
};

export default Admin;
