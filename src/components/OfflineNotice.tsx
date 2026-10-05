import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Discreet top notice shown while the browser is offline. Display only. */
const OfflineNotice = () => {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-3 pt-2"
    >
      <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Você está sem conexão. Alguns dados podem não carregar.</span>
      </div>
    </div>
  );
};

export default OfflineNotice;
