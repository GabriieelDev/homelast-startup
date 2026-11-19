import { useEffect, useState, useCallback, useRef } from "react";
import { playDing } from "@/lib/notifySound";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Bike, MapPin, Package, LogOut, CheckCircle2, Navigation, ShieldAlert, Loader2, XCircle, Wallet } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  payment_method?: string | null;
  cancel_reason?: string | null;
}

interface CancelNotice {
  id: string;
  order_number: number;
  reason: string | null;
}

const PAYMENT_LABEL: Record<string, string> = {
  credit: "Cartão de crédito",
  debit: "Cartão de débito",
  pix: "PIX",
  vale: "Vale",
};

const formatBRL = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

const buildAddressString = (address: any) =>
  address
    ? [`${address.street ?? ""} ${address.number ?? ""}`.trim(), address.neighborhood, address.city]
        .filter(Boolean)
        .join(", ")
    : "";

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
  const userId = user?.id;
  const userEmail = user?.email;
  const [status, setStatus] = useState<CourierStatus>("offline");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ type: "accept" | "deliver"; order: Order } | null>(null);
  const [cancelNotices, setCancelNotices] = useState<CancelNotice[]>([]);
  const myActiveIdsRef = useRef<Map<string, number>>(new Map());

  const loadCourier = useCallback(async () => {
    if (!userId) return;
    // Ensure courier profile exists
    const { data: courierData } = await supabase
      .from("couriers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!courierData) {
      await supabase.from("couriers").insert({
        user_id: userId,
        full_name: userEmail?.split("@")[0] ?? "Entregador",
      });
      setStatus("offline");
    } else {
      setStatus((courierData.status as CourierStatus) ?? "offline");
    }
  }, [userId, userEmail]);

  const loadOrders = useCallback(async () => {
    if (!userId) return;
    setLoadingOrders(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .or(`courier_id.is.null,courier_id.eq.${userId}`)
      .in("status", ["preparo", "caminho"])
      .order("created_at", { ascending: false });
    const list = (data as Order[]) ?? [];
    setOrders(list);
    setLoadingOrders(false);

    // Detecta pedidos em andamento que sumiram da lista por cancelamento.
    const prev = myActiveIdsRef.current;
    const nowMine = new Map<string, number>();
    list.filter((o) => o.courier_id === userId).forEach((o) => nowMine.set(o.id, o.order_number));
    const missing = [...prev.keys()].filter((id) => !nowMine.has(id));
    myActiveIdsRef.current = nowMine;
    if (missing.length > 0) {
      const { data: gone } = await supabase
        .from("orders")
        .select("id, order_number, status, cancel_reason")
        .in("id", missing)
        .eq("status", "cancelado");
      if (gone && gone.length > 0) {
        setCancelNotices((cur) => [
          ...cur,
          ...gone
            .filter((g: any) => !cur.some((c) => c.id === g.id))
            .map((g: any) => ({ id: g.id, order_number: g.order_number, reason: g.cancel_reason ?? null })),
        ]);
        playDing();
      }
    }
  }, [userId]);

  useEffect(() => {
    if (userId && isCourier) {
      loadCourier();
      loadOrders();
    }
  }, [userId, isCourier, loadCourier, loadOrders]);

  // Polling de 5s para pegar pedidos novos mesmo sem realtime.
  useEffect(() => {
    if (!userId || !isCourier) return;
    const id = setInterval(() => { loadOrders(); }, 5000);
    return () => clearInterval(id);
  }, [userId, isCourier, loadOrders]);

  // "Ding" quando um pedido novo aparecer na lista (uma vez por pedido).
  const seenOrderIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const currentIds = new Set(orders.map((o) => o.id));
    if (seenOrderIdsRef.current === null) {
      seenOrderIdsRef.current = currentIds;
      return;
    }
    const prev = seenOrderIdsRef.current;
    const hasNew = orders.some((o) => !prev.has(o.id));
    if (hasNew) playDing();
    seenOrderIdsRef.current = currentIds;
  }, [orders]);

  // Realtime updates for orders
  useEffect(() => {
    if (!userId || !isCourier) return;
    const channel = supabase
      .channel("courier-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isCourier, loadOrders]);

  const updateStatus = async (newStatus: CourierStatus) => {
    if (!userId) return;
    setStatus(newStatus);
    await supabase.from("couriers").update({ status: newStatus }).eq("user_id", userId);
    toast.success(`Status atualizado: ${STATUS_LABEL[newStatus]}`);
  };

  const acceptOrder = async (order: Order) => {
    if (!userId) return;
    setActionLoading(order.id);
    const { data: updated, error } = await supabase
      .from("orders")
      .update({ courier_id: userId, status: "caminho" })
      .eq("id", order.id)
      .is("courier_id", null)
      .select("id");
    setActionLoading(null);
    if (error || !updated || updated.length === 0) {
      toast.error("Esse pedido já foi aceito por outro entregador");
      loadOrders();
      return;
    }
    toast.success("Entrega aceita! Boa rota 🚴");
    await updateStatus("em_entrega");
    loadOrders();
  };

  const markDelivered = async (order: Order) => {
    if (!userId) return;
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
    const q = encodeURIComponent(buildAddressString(address));
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, "_blank", "noopener,noreferrer");
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
  const myActive = orders.filter((o) => o.courier_id === userId);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Bike className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg text-foreground flex-1">HomeLast · Entregador</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
        {cancelNotices.map((n) => (
          <div
            key={n.id}
            role="alert"
            className="bg-destructive/10 border border-destructive/40 rounded-2xl p-4 flex items-start gap-3"
          >
            <XCircle className="h-6 w-6 text-destructive shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-bold text-destructive">Pedido #{n.order_number} foi cancelado</p>
              {n.reason && <p className="text-foreground mt-0.5">Motivo: {n.reason}</p>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelNotices((cur) => cur.filter((c) => c.id !== n.id))}
            >
              Ok
            </Button>
          </div>
        ))}

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
                onPrimary={() => setConfirm({ type: "deliver", order })}
                onOpenMaps={openMaps}
                loading={actionLoading === order.id}
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
                onPrimary={() => setConfirm({ type: "accept", order })}
                onOpenMaps={openMaps}
                loading={actionLoading === order.id}
              />
            ))
          )}
        </section>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="max-w-[92vw] sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === "accept" ? "Aceitar esta entrega?" : "Confirmar entrega?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === "accept"
                ? `Pedido #${confirm?.order.order_number} — você ficará responsável por ele.`
                : `Confirme que o pedido #${confirm?.order.order_number} foi entregue ao cliente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-12 sm:h-10">Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="h-12 sm:h-10"
              onClick={() => {
                const c = confirm;
                setConfirm(null);
                if (!c) return;
                if (c.type === "accept") acceptOrder(c.order);
                else markDelivered(c.order);
              }}
            >
              {confirm?.type === "accept" ? "Aceitar" : "Entregue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
}

const OrderCard = ({ order, primaryAction, primaryColor, onPrimary, onOpenMaps, loading }: OrderCardProps) => {
  const paymentLabel = PAYMENT_LABEL[order.payment_method ?? ""] ?? order.payment_method ?? "—";
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

      <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 flex items-center gap-3">
        <Wallet className="h-6 w-6 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Pagamento: {paymentLabel}</p>
          <p className="text-lg font-extrabold text-primary leading-tight">Receber {formatBRL(order.total)}</p>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">{itemsCount} itens</div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="text-xs text-muted-foreground">Retirada</p>
            <p className="text-foreground">
              {order.pickup_address?.street ?? "Loja HomeLast"}, {order.pickup_address?.neighborhood ?? ""}
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

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1 h-12 text-base sm:h-10 sm:text-sm"
          onClick={() => onOpenMaps(order.address)}
        >
          <Navigation className="h-4 w-4 mr-1" /> Abrir rota no Maps
        </Button>
        <Button
          className={`flex-1 h-12 text-base sm:h-10 sm:text-sm text-white ${primaryColor} hover:opacity-90`}
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
