import { Bell, BellOff, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const MSG_UNSUPPORTED = "Este navegador não suporta notificações push.";
const MSG_IOS = "No iPhone, instale o app na tela inicial (Compartilhar → Adicionar à Tela de Início) para receber notificações. Requer iOS 16.4 ou superior.";
const MSG_DENIED = "As notificações estão bloqueadas no navegador. Libere nas configurações do site e tente de novo.";

/** Returns the message explaining why push can't be enabled, or null. */
const blockedReason = (p: ReturnType<typeof usePushNotifications>) => {
  if (p.iosNeedsInstall) return MSG_IOS;
  if (!p.supported) return MSG_UNSUPPORTED;
  if (p.permission === "denied") return MSG_DENIED;
  return null;
};

export const usePushToggle = (enabledMsg: string) => {
  const push = usePushNotifications();
  const reason = blockedReason(push);
  const toggle = async () => {
    try {
      if (push.subscribed) {
        await push.disable();
        toast.success("Notificações desativadas");
      } else {
        await push.enable();
        toast.success(enabledMsg);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível alterar as notificações");
    }
  };
  return { push, reason, toggle };
};

/** Card for the customer profile page. */
export const PushNotificationsCard = () => {
  const { push, reason, toggle } = usePushToggle("Notificações ativadas 🔔");
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">Notificações</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Receba um aviso neste aparelho quando o status do seu pedido mudar.
      </p>
      {reason ? (
        <p className="text-sm text-muted-foreground bg-secondary/60 rounded-lg p-3">{reason}</p>
      ) : (
        <Button
          type="button"
          variant={push.subscribed ? "outline" : "default"}
          className="w-full gap-2"
          disabled={push.loading || push.busy}
          onClick={toggle}
        >
          {push.subscribed ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
          {push.busy ? "Aguarde..." : push.subscribed ? "Desativar notificações" : "Ativar notificações"}
        </Button>
      )}
    </div>
  );
};

/** Compact button for the admin header. */
export const PushNotificationsButton = () => {
  const { push, reason, toggle } = usePushToggle("Notificações de pedidos ativadas 🔔");
  const onClick = () => (reason ? toast.info(reason) : toggle());
  return (
    <Button
      type="button"
      variant={push.subscribed ? "outline" : "default"}
      size="sm"
      className="gap-1.5"
      disabled={push.loading || push.busy}
      onClick={onClick}
      title={reason ?? undefined}
    >
      {push.subscribed ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
      <span className="hidden sm:inline">
        {push.subscribed ? "Desativar notificações" : "Ativar notificações de pedidos"}
      </span>
      <span className="sm:hidden">{push.subscribed ? "Desativar" : "Notificações"}</span>
    </Button>
  );
};
