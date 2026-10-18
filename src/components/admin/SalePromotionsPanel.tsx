import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { isSaleActive } from "@/lib/promotions";
import { Button } from "@/components/ui/button";
import { Tag, History, TrendingUp, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/reports";

interface ExpirationRow {
  id: string;
  product_id: string;
  product_name: string | null;
  sale_label: string | null;
  expired_at: string;
  acknowledged: boolean;
}

const SalePromotionsPanel = () => {
  const { products } = useProducts();
  const [log, setLog] = useState<ExpirationRow[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: logData }, { data: ordersData }] = await Promise.all([
        supabase.from("sale_expirations_log").select("*").order("expired_at", { ascending: false }).limit(200),
        supabase.from("orders").select("items, total, status, created_at").eq("status", "entregue"),
      ]);
      setLog((logData ?? []) as any);
      setOrders(ordersData ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("sale-expirations-log")
      .on("postgres_changes", { event: "*", schema: "public", table: "sale_expirations_log" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const activeSales = useMemo(() => products.filter((p) => isSaleActive(p)), [products]);

  const productMap = useMemo(() => {
    const m: Record<string, { fullPrice: number }> = {};
    products.forEach((p) => { m[p.id] = { fullPrice: p.price }; });
    return m;
  }, [products]);

  // Revenue impact: per order item, compare sold price vs reference fullPrice
  const impact = useMemo(() => {
    let promoRevenue = 0;
    let normalRevenue = 0;
    let promoUnits = 0;
    let normalUnits = 0;
    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        const qty = Number(it.quantity) || 0;
        const soldPrice = Number(it.price) || 0;
        const ref = productMap[it.id]?.fullPrice ?? soldPrice;
        const wasOnSale = ref > 0 && soldPrice > 0 && soldPrice < ref * 0.995;
        const lineRev = soldPrice * qty;
        if (wasOnSale) { promoRevenue += lineRev; promoUnits += qty; }
        else { normalRevenue += lineRev; normalUnits += qty; }
      });
    });
    const total = promoRevenue + normalRevenue;
    const promoShare = total > 0 ? (promoRevenue / total) * 100 : 0;
    return { promoRevenue, normalRevenue, promoUnits, normalUnits, promoShare };
  }, [orders, productMap]);

  const acknowledge = async (id: string) => {
    const { error } = await supabase.from("sale_expirations_log").update({ acknowledged: true }).eq("id", id);
    if (error) toast.error("Erro ao marcar como lido");
  };

  const acknowledgeAll = async () => {
    const ids = log.filter((l) => !l.acknowledged).map((l) => l.id);
    if (!ids.length) return;
    const { error } = await supabase.from("sale_expirations_log").update({ acknowledged: true }).in("id", ids);
    if (error) toast.error("Erro"); else toast.success("Histórico marcado como lido");
  };

  const exportActive = () => downloadCSV(`promocoes-ativas-${Date.now()}.csv`, activeSales.map((p) => ({
    produto: p.name,
    preco: p.price.toFixed(2),
    promocional: (p.salePrice ?? 0).toFixed(2),
    desconto: p.discountType === "fixed" ? `R$ ${(p.discountValue ?? 0).toFixed(2)}` : `${p.discountValue ?? 0}%`,
    rotulo: p.saleLabel ?? "",
    inicio: p.saleStart ? new Date(p.saleStart).toLocaleString("pt-BR") : "—",
    termino: p.saleEnd ? new Date(p.saleEnd).toLocaleString("pt-BR") : "sem prazo",
  })));

  const exportHistory = () => downloadCSV(`promocoes-encerradas-${Date.now()}.csv`, log.map((l) => ({
    produto: l.product_name ?? l.product_id,
    rotulo: l.sale_label ?? "",
    expirou_em: new Date(l.expired_at).toLocaleString("pt-BR"),
  })));

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>;
  }

  const unread = log.filter((l) => !l.acknowledged).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6 text-accent" /> Relatório de promoções
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeSales.length} promoção(ões) ativa(s) · {log.length} no histórico
          </p>
        </div>
      </div>

      {/* Impact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-xs text-muted-foreground">Faturamento em promoção</p>
          <p className="text-2xl font-bold text-accent">R$ {impact.promoRevenue.toFixed(2)}</p>
          <p className="text-[11px] text-muted-foreground">{impact.promoUnits} un</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary">
          <p className="text-xs text-muted-foreground">Faturamento preço cheio</p>
          <p className="text-2xl font-bold text-foreground">R$ {impact.normalRevenue.toFixed(2)}</p>
          <p className="text-[11px] text-muted-foreground">{impact.normalUnits} un</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary">
          <p className="text-xs text-muted-foreground">% promoção / total</p>
          <p className="text-2xl font-bold text-foreground">{impact.promoShare.toFixed(1)}%</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary">
          <p className="text-xs text-muted-foreground">Total geral</p>
          <p className="text-2xl font-bold text-foreground">R$ {(impact.promoRevenue + impact.normalRevenue).toFixed(2)}</p>
        </div>
      </div>

      {/* Active sales */}
      <div className="p-4 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" /> Promoções ativas
          </h3>
          {activeSales.length > 0 && (
            <Button size="sm" variant="outline" onClick={exportActive}>Exportar CSV</Button>
          )}
        </div>
        {activeSales.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma promoção ativa no momento.</p>
        ) : (
          <div className="divide-y divide-border">
            {activeSales.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center gap-3">
                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-white hl-photo-frame" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    De <span className="line-through">R$ {p.price.toFixed(2)}</span> por{" "}
                    <span className="text-accent font-bold">R$ {(p.salePrice ?? 0).toFixed(2)}</span>
                    {p.saleEnd && <> · até {new Date(p.saleEnd).toLocaleString("pt-BR")}</>}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-bold">
                  {p.saleLabel?.trim() ||
                    (p.discountType === "fixed"
                      ? `-R$ ${(p.discountValue ?? 0).toFixed(2)}`
                      : `-${p.discountValue ?? 0}%`)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="p-4 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" /> Promoções encerradas
            {unread > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                {unread} novo(s)
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            {unread > 0 && (
              <Button size="sm" variant="outline" onClick={acknowledgeAll} className="gap-1.5">
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </Button>
            )}
            {log.length > 0 && <Button size="sm" variant="outline" onClick={exportHistory}>Exportar CSV</Button>}
          </div>
        </div>
        {log.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma promoção encerrada ainda.</p>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {log.map((l) => (
              <div key={l.id} className={`py-2 flex items-center gap-3 ${!l.acknowledged ? "bg-accent/5" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {l.product_name ?? l.product_id}
                    {l.sale_label && <span className="ml-2 text-xs text-muted-foreground">· {l.sale_label}</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Expirou em {new Date(l.expired_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                {!l.acknowledged && (
                  <Button size="sm" variant="ghost" onClick={() => acknowledge(l.id)} className="text-xs">
                    Marcar lido
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalePromotionsPanel;
