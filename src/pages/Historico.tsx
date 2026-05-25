import { LogoIcon } from "@/components/Logo";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Eye } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  order_number: number;
  total: number;
  status: string;
  created_at: string;
  items: { id: string; name: string; quantity: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  recebido: "Recebido",
  preparo: "Em preparo",
  caminho: "A caminho",
  entregue: "Entregue",
};

const Historico = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCartFromProducts } = useCart();
  const { getById } = useProducts();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, order_number, total, status, created_at, items")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderRow[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const buyAgain = (o: OrderRow) => {
    const entries = (o.items ?? [])
      .map((i) => { const p = getById(i.id); return p ? { product: p, quantity: i.quantity } : null; })
      .filter(Boolean) as { product: any; quantity: number }[];
    if (!entries.length) { toast.error("Produtos não estão mais disponíveis"); return; }
    setCartFromProducts(entries);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <LogoIcon className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Histórico</span>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-4xl">🗂️</p>
            <p className="text-lg font-semibold text-foreground">Sem histórico ainda</p>
            <Button onClick={() => navigate("/")} className="mt-2">Começar a comprar</Button>
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground">Pedido #{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(o.items ?? []).slice(0, 3).map((i) => i.name).join(", ")}
                    {(o.items?.length ?? 0) > 3 && ` +${o.items.length - 3}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  <p className="font-bold text-foreground mt-1">R$ {Number(o.total).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => navigate("/rastreamento", { state: { orderId: o.id } })}>
                  <Eye className="h-3.5 w-3.5" /> Ver detalhes
                </Button>
                <Button size="sm" className="flex-1 gap-1.5" onClick={() => buyAgain(o)}>
                  <RefreshCw className="h-3.5 w-3.5" /> Comprar novamente
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Historico;
