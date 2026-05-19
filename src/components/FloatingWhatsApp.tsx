import { useLocation } from "react-router-dom";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { normalizeSocialUrl } from "@/components/SocialLinks";

const HIDDEN_PREFIXES = ["/admin", "/entregador", "/auth", "/reset-password"];

const FloatingWhatsApp = () => {
  const { settings } = useStoreSettings();
  const { pathname } = useLocation();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const wa = (settings.social_links ?? []).find(
    (l) => l.platform === "whatsapp" && l.enabled && l.url?.trim()
  );
  if (!wa) return null;

  const base = normalizeSocialUrl(wa);
  if (!base) return null;
  const msg = encodeURIComponent("Olá! Vim pelo site do ServBem Supermercado e gostaria de ajuda.");
  const href = `${base}${base.includes("?") ? "&" : "?"}text=${msg}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      title="Falar no WhatsApp"
      className="fixed right-4 bottom-24 md:bottom-6 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 flex items-center justify-center transition-transform hover:scale-[1.06] active:scale-[0.97]"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.29c-.27-.14-1.61-.79-1.86-.88-.25-.09-.43-.14-.62.14-.18.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.18-1.34-.81-.72-1.35-1.6-1.51-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.49-.85-2.04-.22-.54-.45-.46-.62-.47l-.53-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.98 2.65 1.12 2.83.14.18 1.93 2.95 4.68 4.13.65.28 1.17.45 1.57.58.66.21 1.26.18 1.73.11.53-.08 1.61-.66 1.84-1.29.23-.63.23-1.17.16-1.29-.07-.12-.25-.18-.52-.32zM16.02 5.33c-5.9 0-10.7 4.8-10.7 10.7 0 1.88.49 3.71 1.43 5.33L5 27l5.79-1.51a10.66 10.66 0 0 0 5.23 1.34h.01c5.89 0 10.7-4.8 10.7-10.7 0-2.86-1.11-5.55-3.13-7.57a10.62 10.62 0 0 0-7.58-3.23zm0 19.55h-.01a8.84 8.84 0 0 1-4.51-1.24l-.32-.19-3.43.9.92-3.35-.21-.34a8.86 8.86 0 0 1-1.36-4.73c0-4.9 4-8.89 8.92-8.89 2.38 0 4.62.93 6.3 2.61a8.84 8.84 0 0 1 2.61 6.29c0 4.9-4 8.89-8.91 8.89z" />
      </svg>
    </a>
  );
};

export default FloatingWhatsApp;
