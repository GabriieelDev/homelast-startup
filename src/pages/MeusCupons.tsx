import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LogoIcon } from "@/components/Logo";
import { ArrowLeft, Copy, Check, TicketPercent } from "lucide-react";
import { toast } from "sonner";

interface RedeemedCoupon {
  id: string;
  redeemed_at: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order: number | null;
  expires_at: string | null;
  active: boolean;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MeusCupons = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Já exclui os cupons que o usuário usou em algum pedido (my_coupons).
  const { data: coupons = [], isPending: loading } = useQuery({
    queryKey: ["my-coupons", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_coupons");
      if (error) throw error;
      return (data ?? [])
        .map((r) => ({ ...r, id: r.coupon_id }) as RedeemedCoupon)
        .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime());
    },
  });

  const handleCopy = async (c: RedeemedCoupon) => {
    try {
      await navigator.clipboard.writeText(c.code);
      setCopiedId(c.id);
      toast.success("Cupom copiado! ✓", { style: { color: "#00B894" } });
      setTimeout(() => setCopiedId((v) => (v === c.id ? null : v)), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const statusOf = (c: RedeemedCoupon) => {
    const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
    if (expired) return { label: "Expirado", expired: true };
    if (!c.active) return { label: "Inativo", expired: true };
    return { label: "Válido", expired: false };
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/perfil")} className="text-foreground" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <LogoIcon className="h-5 w-5 text-primary" />
          <h1 className="font-display font-bold text-lg text-foreground">Meus cupons</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <TicketPercent className="h-8 w-8 text-primary" />
            </div>
            <p className="font-semibold text-foreground">Você ainda não resgatou nenhum cupom</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Quando você copiar um cupom nas promoções, ele aparece aqui.
            </p>
          </div>
        ) : (
          coupons.map((c) => {
            const status = statusOf(c);
            const discount =
              c.discount_type === "percentage"
                ? `${Number(c.discount_value)}% OFF`
                : `${brl(Number(c.discount_value))} OFF`;
            return (
              <div
                key={c.id}
                className={`bg-card border border-border rounded-xl p-4 space-y-3 transition-opacity ${
                  status.expired ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="font-mono font-bold text-lg text-foreground truncate"
                      style={{ letterSpacing: "0.12em" }}
                    >
                      {c.code}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#00B894" }}>
                      {discount}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={
                      status.expired
                        ? { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                        : { backgroundColor: "rgba(0,184,148,0.12)", color: "#00B894" }
                    }
                  >
                    {status.label}
                  </span>
                </div>

                {c.description && (
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                )}
                {c.min_order != null && Number(c.min_order) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Pedido mínimo: {brl(Number(c.min_order))}
                  </p>
                )}

                <button
                  onClick={() => handleCopy(c)}
                  className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white dark:!bg-primary dark:!text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.97]"
                  style={{ backgroundColor: "#1D2D50" }}
                >
                  {copiedId === c.id ? (
                    <><Check className="h-4 w-4" /> Copiado! ✓</>
                  ) : (
                    <><Copy className="h-4 w-4" /> Copiar código</>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default MeusCupons;
