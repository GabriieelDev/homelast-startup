import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Clock, Package } from "lucide-react";
import { useEffect } from "react";
import SocialLinks from "@/components/SocialLinks";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    orderId: string;
    orderNumber: number;
    total: number;
    address: any;
    estimatedTime: string;
  } | null;

  useEffect(() => {
    if (!state) navigate("/", { replace: true });
  }, [state, navigate]);

  if (!state) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Pedido confirmado!</h1>
          <p className="text-muted-foreground">Seu pedido foi recebido com sucesso.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Número do pedido</p>
              <p className="font-bold text-foreground">#{state.orderNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Tempo estimado</p>
              <p className="font-bold text-foreground">{state.estimatedTime}</p>
            </div>
          </div>

          {state.address && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Entrega em</p>
                <p className="font-bold text-foreground">
                  {state.address.street}, {state.address.number} - {state.address.neighborhood}
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
            <span>Total pago</span>
            <span>R$ {state.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={() => navigate("/rastreamento", { state: { orderId: state.orderId } })} className="w-full h-12 text-base font-bold">
            Acompanhar pedido
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            Continuar comprando
          </Button>
        </div>

        <div className="pt-2 space-y-2">
          <p className="text-sm text-muted-foreground">Siga-nos nas redes sociais</p>
          <div className="flex justify-center">
            <SocialLinks variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
