import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "@/components/ui/sonner";

const UPDATE_TOAST_ID = "pwa-update";
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Shows a toast when a new service worker is waiting. The page only reloads
 * when the user presses "Atualizar" — never on its own (e.g. mid-checkout).
 */
const PwaUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        if (registration.installing || !navigator.onLine) return;
        registration.update().catch(() => {});
      }, CHECK_INTERVAL_MS);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast("Nova versão disponível", {
      id: UPDATE_TOAST_ID,
      description: "Atualize para usar a versão mais recente do app.",
      duration: Infinity,
      action: {
        label: "Atualizar",
        onClick: () => updateServiceWorker(true),
      },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
};

export default PwaUpdatePrompt;
