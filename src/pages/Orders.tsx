import { LogoIcon } from "@/components/Logo";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, ChefHat, RefreshCw } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  recebido: { label: "Pedido recebido", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", icon: Package },
  preparo: { label: "Em preparo", color: "bg-orange-500/10 text-orange-600 border-orange-500/30", icon: ChefHat },
  caminho: { label: "A caminho", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Truck },
  entregue: { label: "Entregue", color: "bg-primary/10 text-primary border-primary/30", icon: CheckCircle },
};

interface Order {
  id: string;
  order_number: number;
  total: number;
  status: keyof typeof STATUS_META;
  created_at: string;
  estimated_time: string | null;
  items?: { id: string; name: string; quantity: number }[];
}

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCartFromProducts } = useCart();
  const { getById } = useProducts();
  const repurchase = (items: { id: string; quantity: number }[]) => {
    const entries = items
      .map((i) => { const p = getById(i.id); return p ? { product: p, quantity: i.quantity } : null; })
      .filter(Boolean) as { product: any; quantity: number }[];
    if (!entries.length) { toast.error("Produtos não estão mais disponíveis"); return; }
    setCartFromProducts(entries);
    navigate("/");
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, estimated_time, items")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    };
    load();
    const pollInterval = setInterval(load, 5000);

    const channel = supabase
      .channel(`orders-list-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Order;
          setOrders((prev) => (prev.some((o) => o.id === row.id) ? prev : [row, ...prev]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === row.id ? { ...o, ...row } : o)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
        (payload) => {
          const oldRow = payload.old as { id: string };
          setOrders((prev) => prev.filter((o) => o.id !== oldRow.id));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); clearInterval(pollInterval); };
  }, [userId]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <LogoIcon className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Meus pedidos</span>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-4xl">📦</p>
            <p className="text-lg font-semibold text-foreground">Nenhum pedido ainda</p>
            <p className="text-muted-foreground">Que tal fazer seu primeiro pedido?</p>
            <Button onClick={() => navigate("/")} className="mt-2">Ver produtos</Button>
          </div>
        ) : (
          orders.map((o) => {
            const meta = STATUS_META[o.status] ?? STATUS_META.recebido;
            const Icon = meta.icon;
            return (
              <div key={o.id} className="bg-card border border-border rounded-xl p-4 space-y-3 transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">Pedido #{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" /> {meta.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground">R$ {Number(o.total).toFixed(2)}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate("/rastreamento", { state: { orderId: o.id } })}>
                      Ver detalhes
                    </Button>
                    {o.items?.length ? (
                      <Button size="sm" className="gap-1.5" onClick={() => repurchase(o.items!)}>
                        <RefreshCw className="h-3.5 w-3.5" /> Recomprar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Orders;
