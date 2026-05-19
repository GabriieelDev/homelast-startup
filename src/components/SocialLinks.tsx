import { Instagram, Facebook, MessageCircle, Music2 } from "lucide-react";
import { useStoreSettings, type SocialLink } from "@/hooks/useStoreSettings";

const ICONS: Record<SocialLink["platform"], any> = {
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: MessageCircle,
  tiktok: Music2,
};

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

const SocialLinks = ({ variant = "footer", size = "md" }: Props) => {
  const { settings } = useStoreSettings();
  const links = (settings.social_links ?? [])
    .filter((l) => l.enabled && l.url?.trim())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (links.length === 0) return null;

  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const base =
    variant === "footer"
      ? "bg-background/10 hover:bg-background/20 text-background"
      : "bg-secondary hover:bg-secondary/70 text-foreground border border-border";

  return (
    <div className="flex items-center gap-2 flex-wrap">
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
            className={`${dim} ${base} rounded-full flex items-center justify-center transition-colors`}
          >
            <Icon className={icon} />
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
