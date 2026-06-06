import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cartSync } from "@/hooks/useCart";

const CartSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const channelRef = useRef<any>(null);
  const lastUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const cleanupChannel = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    if (!user) {
      if (lastUserRef.current) {
        cartSync.onLogout();
        lastUserRef.current = null;
        cleanupChannel();
      }
      return;
    }

    if (lastUserRef.current === user.id) return;
    lastUserRef.current = user.id;

    cartSync.onLogin(user.id);

    cleanupChannel();
    channelRef.current = supabase
      .channel(`user-cart-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_carts", filter: `user_id=eq.${user.id}` },
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

    return cleanupChannel;
  }, [user, loading]);

  return <>{children}</>;
};

export default CartSyncProvider;
