import { useEffect, useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Bike, MapPin, Package, LogOut, CheckCircle2, Navigation, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

type CourierStatus = "disponivel" | "em_entrega" | "offline";
type OrderStatus = "recebido" | "preparo" | "caminho" | "entregue";

interface Order {
  id: string;
  order_number: number;
  total: number;
  status: OrderStatus;
  address: any;
  pickup_address: any;
  items: any;
  courier_id: string | null;
  estimated_time: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<CourierStatus, string> = {
  disponivel: "Disponível",
  em_entrega: "Em entrega",
  offline: "Offline",
};

const STATUS_COLORS: Record<CourierStatus, string> = {
  disponivel: "bg-primary text-primary-foreground",
  em_entrega: "bg-accent text-accent-foreground",
  offline: "bg-muted text-muted-foreground",
};

const Courier = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isCourier, loading: roleLoading } = useUserRole();
  const [status, setStatus] = useState<CourierStatus>("offline");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadCourier = useCallback(async () => {
    if (!user) return;
    // Ensure courier profile exists
    const { data: courierData } = await supabase
      .from("couriers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!courierData) {
      await supabase.from("couriers").insert({
        user_id: user.id,
        full_name: user.email?.split("@")[0] ?? "Entregador",
      });
      setStatus("offline");
    } else {
      setStatus((courierData.status as CourierStatus) ?? "offline");
    }
  }, [user]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .or(`courier_id.is.null,courier_id.eq.${user.id}`)
      .in("status", ["preparo", "caminho"])
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoadingOrders(false);
  }, [user]);

  useEffect(() => {
    if (user && isCourier) {
      loadCourier();
      loadOrders();
    }
  }, [user, isCourier, loadCourier, loadOrders]);

  // Realtime updates for orders
  useEffect(() => {
    if (!user || !isCourier) return;
    const channel = supabase
      .channel("courier-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isCourier, loadOrders]);

  const updateStatus = async (newStatus: CourierStatus) => {
    if (!user) return;
    setStatus(newStatus);
    await supabase.from("couriers").update({ status: newStatus }).eq("user_id", user.id);
    toast.success(`Status atualizado: ${STATUS_LABEL[newStatus]}`);
  };

  const acceptOrder = async (order: Order) => {
    if (!user) return;
    setActionLoading(order.id);
    const { error } = await supabase
      .from("orders")
      .update({ courier_id: user.id, status: "caminho" })
      .eq("id", order.id);
    setActionLoading(null);
    if (error) {
      toast.error("Não foi possível aceitar a entrega.");
      return;
    }
    toast.success("Entrega aceita! Boa rota 🚴");
    await updateStatus("em_entrega");
    loadOrders();
  };

  const markDelivered = async (order: Order) => {
    if (!user) return;
    setActionLoading(order.id);
    const { error } = await supabase
      .from("orders")
      .update({ status: "entregue" })
      .eq("id", order.id);
    setActionLoading(null);
    if (error) {
      toast.error("Não foi possível concluir a entrega.");
      return;
    }
    toast.success("Pedido entregue! ✅");
    await updateStatus("disponivel");
    loadOrders();
  };

  const openMaps = (address: any) => {
    if (!address) return;
    const q = encodeURIComponent(
      `${address.street ?? ""} ${address.number ?? ""}, ${address.neighborhood ?? ""}, ${address.city ?? ""}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/entregador/login" replace />;

  if (!isCourier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4 bg-card border border-border rounded-2xl p-8 shadow-sm">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Acesso restrito a entregadores</h1>
          <p className="text-muted-foreground">Sua conta não tem permissão de entregador.</p>
          <Button onClick={() => navigate("/")}>Voltar</Button>
        </div>
      </div>
    );
  }

  const available = orders.filter((o) => !o.courier_id);
  const myActive = orders.filter((o) => o.courier_id === user.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Bike className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg text-foreground flex-1">ServBem · Entregador</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Status selector */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-3">Seu status atual</p>
          <div className="flex flex-wrap gap-2">
            {(["disponivel", "em_entrega", "offline"] as CourierStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all btn-press ${
                  status === s ? STATUS_COLORS[s] + " shadow" : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* My active deliveries */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Em andamento ({myActive.length})
          </h2>
          {myActive.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-4">
              Nenhuma entrega em andamento.
            </p>
          ) : (
            myActive.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                primaryAction="Pedido entregue"
                primaryColor="bg-primary"
                onPrimary={() => markDelivered(order)}
                onOpenMaps={openMaps}
                loading={actionLoading === order.id}
                showRoute
              />
            ))
          )}
        </section>

        {/* Available */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Navigation className="h-5 w-5 text-accent" /> Disponíveis ({available.length})
          </h2>
          {loadingOrders ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : available.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-4">
              Nenhuma entrega disponível agora. Volte em alguns minutos.
            </p>
          ) : (
            available.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                primaryAction="Aceitar entrega"
                primaryColor="bg-accent"
                onPrimary={() => acceptOrder(order)}
                onOpenMaps={openMaps}
                loading={actionLoading === order.id}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  primaryAction: string;
  primaryColor: string;
  onPrimary: () => void;
  onOpenMaps: (address: any) => void;
  loading: boolean;
  showRoute?: boolean;
}

const OrderCard = ({ order, primaryAction, primaryColor, onPrimary, onOpenMaps, loading, showRoute }: OrderCardProps) => {
  const itemsCount = Array.isArray(order.items) ? order.items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0) : 0;
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Pedido</p>
          <p className="font-bold text-foreground">#{order.order_number}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-bold text-primary">R$ {Number(order.total).toFixed(2)}</p>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">{itemsCount} itens</div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="text-xs text-muted-foreground">Retirada</p>
            <p className="text-foreground">
              {order.pickup_address?.street ?? "Loja ServBem"}, {order.pickup_address?.neighborhood ?? ""}
            </p>
          </div>
          <button onClick={() => onOpenMaps(order.pickup_address)} className="text-primary text-xs hover:underline">
            Ver
          </button>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="text-xs text-muted-foreground">Entrega</p>
            <p className="text-foreground">
              {order.address?.street}, {order.address?.number} — {order.address?.neighborhood}, {order.address?.city}
            </p>
          </div>
          <button onClick={() => onOpenMaps(order.address)} className="text-primary text-xs hover:underline">
            Ver
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {showRoute && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onOpenMaps(order.address)}
          >
            <Navigation className="h-4 w-4 mr-1" /> Iniciar rota
          </Button>
        )}
        <Button
          size="sm"
          className={`flex-1 text-white ${primaryColor} hover:opacity-90`}
          onClick={onPrimary}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1" /> {primaryAction}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Courier;
