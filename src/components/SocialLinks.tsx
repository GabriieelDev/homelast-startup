import { useStoreSettings, type SocialLink } from "@/hooks/useStoreSettings";

const LABELS: Record<SocialLink["platform"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
};

interface Props {
  variant?: "footer" | "inline";
  size?: "sm" | "md";
}

export function normalizeSocialUrl(link: SocialLink): string {
  const raw = (link.url || "").trim();
  if (!raw) return "";
  if (link.platform === "whatsapp") {
    if (/^https?:\/\//i.test(raw)) return raw;
    const digits = raw.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F77737" />
        <stop offset="50%" stopColor="#E1306C" />
        <stop offset="100%" stopColor="#833AB4" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#ig-grad)" />
    <rect x="8" y="8" width="16" height="16" rx="5" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="16" cy="16" r="4" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="22" cy="10" r="1.4" fill="#fff" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#1877F2" />
    <path
      fill="#fff"
      d="M18.4 27v-9.3h3.1l.5-3.7h-3.6v-2.3c0-1.1.3-1.8 1.8-1.8h2V6.6c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.7h-3.1v3.7h3.1V27h3.7z"
    />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#25D366" />
    <path
      fill="#fff"
      d="M21.6 18.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.5.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.9 2.9 4.6 4.1.6.3 1.1.5 1.5.6.6.2 1.2.2 1.7.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM16 6.4C10.7 6.4 6.4 10.7 6.4 16c0 1.7.5 3.4 1.3 4.8L6.4 25.6l5-1.3c1.4.8 2.9 1.2 4.6 1.2h.1c5.3 0 9.5-4.3 9.5-9.5 0-2.5-1-4.9-2.8-6.7-1.8-1.9-4.2-2.9-6.8-2.9z"
    />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#000" />
    <g transform="translate(7 6)">
      <path fill="#FF0050" d="M13.2 0c.2 2.3 1.5 4.1 3.8 4.3v2.5c-1.4.1-2.6-.4-4-1.2v5.6c0 5.4-5.9 7-8.3 3.2-1.5-2.5-.6-6.7 4.3-6.9v2.7c-.4.1-.8.2-1.1.3-1.1.4-1.7 1.1-1.5 2.3.3 2.3 4.5 3 4.2-1.5V0h2.6z" />
      <path fill="#00F2EA" d="M14.2 1c.2 2.3 1.5 4.1 3.8 4.3v2.5c-1.4.1-2.6-.4-4-1.2v5.6c0 5.4-5.9 7-8.3 3.2-1.5-2.5-.6-6.7 4.3-6.9v2.7c-.4.1-.8.2-1.1.3-1.1.4-1.7 1.1-1.5 2.3.3 2.3 4.5 3 4.2-1.5V1h2.6z" />
      <path fill="#fff" d="M13.7.5c.2 2.3 1.5 4.1 3.8 4.3v2.5c-1.4.1-2.6-.4-4-1.2v5.6c0 5.4-5.9 7-8.3 3.2-1.5-2.5-.6-6.7 4.3-6.9v2.7c-.4.1-.8.2-1.1.3-1.1.4-1.7 1.1-1.5 2.3.3 2.3 4.5 3 4.2-1.5V.5h2.6z" />
    </g>
  </svg>
);

const ICONS: Record<SocialLink["platform"], (props: { className?: string }) => JSX.Element> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  whatsapp: WhatsAppIcon,
  tiktok: TikTokIcon,
};

const SocialLinks = ({ variant = "footer", size = "md" }: Props) => {
  const { settings } = useStoreSettings();
  const links = (settings.social_links ?? [])
    .filter((l) => l.enabled && l.url?.trim())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (links.length === 0) return null;

  void variant;
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {links.map((l, i) => {
        const Icon = ICONS[l.platform];
        const href = normalizeSocialUrl(l);
        if (!href) return null;
        return (
          <a
            key={`${l.platform}-${i}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={LABELS[l.platform]}
            title={LABELS[l.platform]}
            className={`${dim} rounded-[8px] overflow-hidden block transition-all hover:brightness-90 hover:scale-[1.05] active:scale-[0.97]`}
          >
            <Icon className="h-full w-full block" />
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
