import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Zap, ArrowLeft, Package, ChefHat, Truck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: "received", label: "Pedido recebido", icon: Package },
  { id: "preparing", label: "Em preparo", icon: ChefHat },
  { id: "dispatched", label: "Saiu para entrega", icon: Truck },
  { id: "arriving", label: "A caminho", icon: CheckCircle },
];

const OrderTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { orderNumber: number; estimatedTime: string } | null;
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
      return;
    }
    // Simulate step progression
    const timers = [
      setTimeout(() => setCurrentStep(1), 5000),
      setTimeout(() => setCurrentStep(2), 15000),
      setTimeout(() => setCurrentStep(3), 25000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [state, navigate]);

  if (!state) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Acompanhar pedido</span>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-8 space-y-8">
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">Pedido #{state.orderNumber}</p>
          <p className="text-lg font-bold text-foreground">Tempo estimado: {state.estimatedTime}</p>
        </div>

        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const active = i <= currentStep;
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-500 ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-0.5 h-12 transition-colors duration-500 ${
                      i < currentStep ? "bg-primary" : "bg-border"
                    }`} />
                  )}
                </div>
                <div className="pt-2">
                  <p className={`font-semibold transition-colors duration-500 ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
          Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default OrderTracking;
