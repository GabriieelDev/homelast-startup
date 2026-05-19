import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cartSync, type CartItem } from "@/hooks/useCart";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CartSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const channelRef = useRef<any>(null);
  const lastUserRef = useRef<string | null>(null);
  const [dialog, setDialog] = useState<null | {
    local: CartItem[];
    server: CartItem[];
    resolve: (choice: "merge" | "replace") => void;
  }>(null);

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

    cartSync.onLogin(user.id, (local, server) =>
      new Promise((resolve) => setDialog({ local, server, resolve }))
    );

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
              items.filter((i: any) => i?.product?.id) as CartItem[]
            );
          }
        }
      )
      .subscribe();

    return cleanupChannel;
  }, [user, loading]);

  return (
    <>
      {children}
      <AlertDialog open={!!dialog} onOpenChange={(o) => { if (!o && dialog) { dialog.resolve("merge"); setDialog(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Carrinho salvo encontrado</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem <strong>{dialog?.local.length ?? 0} itens</strong> neste dispositivo e
              <strong> {dialog?.server.length ?? 0} itens</strong> salvos na sua conta. O que deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { dialog?.resolve("replace"); setDialog(null); }}>
              Substituir pelo salvo
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => { dialog?.resolve("merge"); setDialog(null); }}>
              Mesclar carrinhos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CartSyncProvider;
