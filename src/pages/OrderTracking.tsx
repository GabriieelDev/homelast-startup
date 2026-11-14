import { LogoIcon } from "@/components/Logo";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ChefHat, Truck, CheckCircle, MapPin, Clock, Star, XCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { normalizeSocialUrl } from "@/components/SocialLinks";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STEPS = [
  { id: "recebido", label: "Pedido recebido", icon: Package, color: "bg-yellow-500" },
  { id: "preparo", label: "Em preparo", icon: ChefHat, color: "bg-orange-500" },
  { id: "caminho", label: "A caminho", icon: Truck, color: "bg-blue-500" },
  { id: "entregue", label: "Entregue", icon: CheckCircle, color: "bg-primary" },
];

const STATUS_MESSAGES: Record<string, string> = {
  recebido: "Recebemos seu pedido! 🎉",
  preparo: "Estamos preparando seu pedido 👨‍🍳",
  caminho: "Seu pedido saiu para entrega 🚚",
  entregue: "Pedido entregue! Bom apetite 🥳",
  cancelado: "Pedido cancelado",
};

const CANCEL_REASONS = ["Errei o pedido", "Demorou demais", "Mudei de ideia", "Outro"];

const OrderTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as { orderId?: string; orderNumber?: number } | null;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const { settings } = useStoreSettings();
  const whatsappUrl = (() => {
    const link = settings.social_links.find((l) => l.platform === "whatsapp" && l.enabled);
    return link ? normalizeSocialUrl(link) : "";
  })();
  const statusRef = useRef<string | null>(null);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // From in-app navigation (state) or from a push notification (?pedido=<id>).
  const orderId = state?.orderId ?? new URLSearchParams(location.search).get("pedido") ?? undefined;
  useEffect(() => {
    if (!orderId || !user?.id) {
      navigate("/pedidos", { replace: true });
      return;
    }

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    statusRef.current = null;

    const stop = () => {
      if (pollId) { clearInterval(pollId); pollId = null; }
      if (channel) { supabase.removeChannel(channel); channel = null; }
    };

    const applyOrder = (row: any) => {
      if (cancelled || !row) return;
      const prevStatus = statusRef.current;
      if (prevStatus !== row.status) {
        statusRef.current = row.status;
        setOrder(row);
        if (prevStatus !== null) {
          toast.success(STATUS_MESSAGES[row.status] ?? "Status atualizado");
        }
      }
      if (row.status === "entregue" || row.status === "cancelado") stop();
    };

    const fetchOrder = async (initial = false) => {
      const { data } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (cancelled) return;
      if (!data) {
        if (initial) navigateRef.current("/pedidos", { replace: true });
        return;
      }
      applyOrder(data);
      if (initial) {
        setLoading(false);
        const { data: rev } = await supabase.from("order_reviews").select("*").eq("order_id", orderId).maybeSingle();
        if (!cancelled) setReview(rev);
      }
    };

    fetchOrder(true).then(() => {
      if (cancelled || !statusRef.current) return;
      if (statusRef.current === "entregue" || statusRef.current === "cancelado") return;

      channel = supabase
        .channel(`order-tracking-${orderId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (payload) => {
          applyOrder(payload.new);
        })
        .subscribe();

      // Polling de segurança caso o Realtime falhe
      pollId = setInterval(() => { fetchOrder(); }, 6000);
    });

    return () => { cancelled = true; stop(); };
  }, [orderId, user?.id]);

  const handleSubmitReview = async () => {
    if (!rating || !user || !order) return;
    setSubmitting(true);
    const { error } = await supabase.from("order_reviews").insert({
      order_id: order.id,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Erro ao enviar avaliação"); return; }
    toast.success("Avaliação enviada com sucesso ⭐");
    setReview({ rating, comment });
  };

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    const { error } = await supabase.rpc("cancel_order", {
      p_order_id: order.id,
      p_reason: cancelReason || undefined,
    });
    setCancelling(false);
    if (error) { toast.error(error.message || "Não foi possível cancelar o pedido"); return; }
    toast.success("Pedido cancelado");
    setCancelReason("");
    // Atualiza já, sem esperar o realtime
    const { data } = await supabase.from("orders").select("*").eq("id", order.id).maybeSingle();
    if (data) { statusRef.current = data.status; setOrder(data); }
  };

  if (loading || !order) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  const isCancelled = order.status === "cancelado";
  const currentStep = STEPS.findIndex((s) => s.id === order.status);
  const progressPct = ((currentStep + 1) / STEPS.length) * 100;
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/pedidos")} className="text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <LogoIcon className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Acompanhar pedido</span>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-6 space-y-6 pb-12">
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">Pedido #{order.order_number}</p>
          <p className="text-lg font-bold text-foreground animate-fade-in" key={order.status}>
            {STATUS_MESSAGES[order.status]}
          </p>
          {order.status !== "entregue" && !isCancelled && order.estimated_time && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
              <Clock className="h-4 w-4" /> Chega em {order.estimated_time}
            </p>
          )}
          {isCancelled && order.cancel_reason && (
            <p className="text-sm text-muted-foreground">Motivo: {order.cancel_reason}</p>
          )}
        </div>

        {isCancelled && (
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <XCircle className="h-8 w-8" />
            </div>
          </div>
        )}

        {/* Progress bar */}
        {!isCancelled && (<>
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const active = i <= currentStep;
            const isCurrent = i === currentStep;
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    active ? `${step.color} text-white shadow-lg` : "bg-muted text-muted-foreground"
                  } ${isCurrent ? "scale-110 ring-4 ring-primary/20" : ""}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-0.5 h-12 transition-colors duration-500 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
                <div className="pt-2">
                  <p className={`font-semibold transition-colors duration-500 ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        </>)}

        {(order.status === "recebido" || order.status === "preparo") && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                Cancelar pedido
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar este pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                  Os itens voltam ao estoque e, se você usou cupom, ele fica disponível de novo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger><SelectValue placeholder="Motivo (opcional)" /></SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={cancelling}>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={cancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => { e.preventDefault(); handleCancel(); }}
                >
                  {cancelling ? "Cancelando..." : "Cancelar pedido"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {order.status === "caminho" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-sm text-muted-foreground">
            <p>Seu pedido já saiu para entrega. Para cancelar, fale com o mercado.</p>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-primary">
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Address */}
        {order.address && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Endereço de entrega</h3>
            <p className="text-sm text-muted-foreground">
              {order.address.street}, {order.address.number} - {order.address.neighborhood}, {order.address.city}
            </p>
          </div>
        )}

        {/* Items */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Itens do pedido</h3>
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.quantity}x R$ {Number(item.price).toFixed(2)}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">R$ {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
            <span>Total</span>
            <span>R$ {Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Review section */}
        {order.status === "entregue" && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-foreground text-lg">Como foi sua experiência?</h3>
              {!review && <p className="text-sm text-muted-foreground">Sua opinião nos ajuda a melhorar</p>}
            </div>

            {review ? (
              <div className="text-center space-y-2">
                <div className="flex justify-center gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`h-6 w-6 ${n <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                  ))}
                </div>
                {review.comment && <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>}
                <p className="text-xs text-primary font-semibold">✓ Avaliação enviada</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star className={`h-9 w-9 transition-colors ${
                        n <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted"
                      }`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Deixe um comentário (opcional)"
                  rows={3}
                />
                <Button onClick={handleSubmitReview} disabled={!rating || submitting} className="w-full">
                  {submitting ? "Enviando..." : "Enviar avaliação"}
                </Button>
              </>
            )}
          </div>
        )}

        <Button variant="outline" onClick={() => navigate("/")} className="w-full">Continuar comprando</Button>
      </div>
    </div>
  );
};

export default OrderTracking;
