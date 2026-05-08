import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS_MSG: Record<string, string> = {
  recebido: "Seu pedido foi recebido 🛒",
  preparo: "Seu pedido está em preparo 🍳",
  caminho: "Seu pedido saiu para entrega 🚚",
  entregue: "Seu pedido foi entregue ✅ — Avalie sua experiência ⭐",
};

/**
 * Subscribes to the current user's orders and shows real-time toast
 * notifications whenever the status changes.
 */
export function useOrderNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lastStatus = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    // Seed current statuses to avoid spamming on initial load
    supabase
      .from("orders")
      .select("id, status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        (data ?? []).forEach((o: any) => (lastStatus.current[o.id] = o.status));
      });

    const channel = supabase
      .channel(`user-orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (!row) return;
          const prev = lastStatus.current[row.id];
          const next = row.status;
          if (payload.eventType === "INSERT") {
            lastStatus.current[row.id] = next;
            toast.success(STATUS_MSG.recebido, {
              description: `Pedido #${row.order_number}`,
              action: { label: "Acompanhar", onClick: () => navigate("/rastreamento", { state: { orderId: row.id } }) },
            });
          } else if (payload.eventType === "UPDATE" && prev !== next && STATUS_MSG[next]) {
            lastStatus.current[row.id] = next;
            toast(STATUS_MSG[next], {
              description: `Pedido #${row.order_number}`,
              action: { label: "Ver", onClick: () => navigate("/rastreamento", { state: { orderId: row.id } }) },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);
}
