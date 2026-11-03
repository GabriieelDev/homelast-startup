import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushPermission = NotificationPermission | "unsupported";

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS reports itself as Mac
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// push_subscriptions is not in the generated types yet.
const pushTable = () => (supabase as any).from("push_subscriptions");

export const usePushNotifications = () => {
  const { user } = useAuth();
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  // On iPhone, web push only exists for apps added to the home screen (iOS 16.4+).
  const iosNeedsInstall = typeof window !== "undefined" && isIos() && !isStandalone();

  const [permission, setPermission] = useState<PushPermission>(
    supported ? Notification.permission : "unsupported",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(supported);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    // getRegistration (not .ready) so this never hangs when no SW is active, e.g. in dev.
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => { if (!cancelled) setSubscribed(!!sub); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [supported, user?.id]);

  const enable = useCallback(async () => {
    if (!supported) throw new Error("Este navegador não suporta notificações.");
    if (!user) throw new Error("Faça login para ativar as notificações.");
    if (!VAPID_PUBLIC_KEY) throw new Error("Notificações não configuradas (chave VAPID ausente).");
    setBusy(true);
    try {
      // Must run from a user click: browsers block permission prompts otherwise.
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        throw new Error(
          result === "denied"
            ? "Permissão bloqueada no navegador."
            : "Permissão não concedida.",
        );
      }
      // No service worker in dev (vite-plugin-pwa is only active in the build).
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) throw new Error("Service worker indisponível. Recarregue o app e tente de novo.");
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const json = sub.toJSON();
      const { error } = await pushTable().upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        },
        { onConflict: "endpoint" },
      );
      if (error) {
        await sub.unsubscribe().catch(() => {});
        throw new Error("Erro ao salvar inscrição de notificações.");
      }
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }, [supported, user]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await pushTable().delete().eq("endpoint", endpoint);
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [supported]);

  return {
    supported,
    iosNeedsInstall,
    permission,
    subscribed,
    loading,
    busy,
    enable,
    disable,
  };
};
