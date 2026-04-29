import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, ArrowLeft, MapPin, CreditCard, QrCode, Banknote, Truck, Tag, X, CheckCircle2 } from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { useCoupon } from "@/hooks/useCoupon";

const PAYMENT_METHODS = [
  { id: "credit", label: "Cartão de crédito", icon: CreditCard },
  { id: "debit", label: "Cartão de débito", icon: CreditCard },
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "vale", label: "Vale-refeição", icon: Banknote },
];

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [address, setAddress] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const { coupon, error: couponError, loading: couponLoading, apply: applyCoupon, clear: clearCoupon } = useCoupon();

  const rawState = location.state as { items: CartItem[]; totalPrice: number; frete?: number } | null;
  const state = rawState
    ? { ...rawState, frete: typeof rawState.frete === "number" ? rawState.frete : Number((Math.random() * 10 + 5).toFixed(2)) }
    : null;

  useEffect(() => {
    if (!state?.items?.length) {
      navigate("/");
      return;
    }
    if (user) {
      supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle()
        .then(({ data }) => setAddress(data));
    }
  }, [user, state, navigate]);

  if (!state) return null;

  const { items, totalPrice, frete } = state;
  const effectiveShipping = coupon?.freeShipping ? 0 : frete;
  const discount = coupon ? coupon.discountAmount : 0;
  const total = Math.max(0, totalPrice + effectiveShipping - (coupon?.freeShipping ? 0 : discount));

  const handleApplyCoupon = async () => {
    await applyCoupon(couponInput, { subtotal: totalPrice, shipping: frete });
  };

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    const estimatedTime = "30–50 min";
    const itemsPayload = items.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      image: i.product.image,
    }));
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        items: itemsPayload,
        subtotal: totalPrice,
        shipping: effectiveShipping,
        discount,
        coupon_code: coupon?.code ?? null,
        total,
        payment_method: selectedPayment,
        address,
        estimated_time: estimatedTime,
      })
      .select("id")
      .single();
    setLoading(false);
    if (error || !data) return;
    navigate("/confirmacao", {
      state: { orderId: data.id, orderNumber, total, address, estimatedTime },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Pagamento</span>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-6 space-y-6 pb-32">
        {/* Address */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Endereço de entrega
            </h3>
            <button onClick={() => navigate("/enderecos")} className="text-primary text-sm hover:underline">
              Trocar
            </button>
          </div>
          {address ? (
            <p className="text-sm text-muted-foreground">
              {address.street}, {address.number} - {address.neighborhood}, {address.city}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum endereço selecionado</p>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Resumo do pedido</h3>
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">{item.quantity}x R$ {item.product.price.toFixed(2)}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">
                R$ {(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">R$ {totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> Frete
              </span>
              <span className={coupon?.freeShipping ? "text-primary line-through" : "text-foreground"}>
                R$ {frete.toFixed(2)}
              </span>
            </div>
            {coupon && (
              <div className="flex justify-between text-sm">
                <span className="text-primary flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Cupom {coupon.code}
                </span>
                <span className="text-primary font-semibold">- R$ {(coupon.freeShipping ? frete : discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground text-lg pt-1">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Coupon */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Cupom de desconto
          </h3>
          {coupon ? (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{coupon.code}</p>
                  <p className="text-xs text-muted-foreground">Cupom aplicado com sucesso</p>
                </div>
              </div>
              <button onClick={() => { clearCoupon(); setCouponInput(""); }} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Digite seu cupom"
                  className="uppercase"
                />
                <Button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()} variant="outline">
                  {couponLoading ? "..." : "Aplicar"}
                </Button>
              </div>
              {couponError && <p className="text-xs text-destructive">{couponError}</p>}
              <p className="text-xs text-muted-foreground">
                Experimente: <span className="font-mono">BEMVINDO10</span>, <span className="font-mono">FRETEGRATIS</span>
              </p>
            </>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Forma de pagamento</h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedPayment(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  selectedPayment === m.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <m.icon className={`h-5 w-5 ${selectedPayment === m.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${selectedPayment === m.id ? "text-foreground" : "text-muted-foreground"}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="container mx-auto max-w-lg">
          <Button onClick={handleConfirm} className="w-full h-12 text-base font-bold" disabled={loading || !address}>
            {loading ? "Processando..." : `Confirmar pedido • R$ ${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
