import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap, ArrowLeft, MapPin, CreditCard, QrCode, Banknote, Truck } from "lucide-react";
import { CartItem } from "@/hooks/useCart";

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
  const total = totalPrice + frete;

  const handleConfirm = () => {
    setLoading(true);
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    setTimeout(() => {
      navigate("/confirmacao", {
        state: { orderNumber, total, address, estimatedTime: "30–50 min" },
        replace: true,
      });
    }, 1500);
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
              <span className="text-foreground">R$ {frete.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground text-lg pt-1">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
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
