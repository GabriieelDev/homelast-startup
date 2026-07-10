import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cartSync } from "@/hooks/useCart";

const CartSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (loading) return;

    const cleanupChannel = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    if (!userId) {
      cartSync.onLogout();
      cleanupChannel();
      return;
    }

    // cartSync.onLogin is idempotent per userId (module-level guard),
    // so remounts / StrictMode double-invocations won't re-run the merge.
    void cartSync.onLogin(userId);

    if (!channelRef.current) {
      channelRef.current = supabase
        .channel(`user-cart-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_carts", filter: `user_id=eq.${userId}` },
          (payload) => {
            const items = (payload.new as any)?.items;
            if (Array.isArray(items)) {
              cartSync.applyServerSnapshot(
                items.filter((i: any) => i?.product?.id)
              );
            }
          }
        )
        .subscribe();
    }

    return cleanupChannel;
  }, [userId, loading]);

  return <>{children}</>;
};

export default CartSyncProvider;

