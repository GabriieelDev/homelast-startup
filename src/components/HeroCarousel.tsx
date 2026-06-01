import { useEffect, useMemo, useRef, useState, useCallback, TouchEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Truck, ShieldCheck, Star, Flame, Gift, Copy, Check,
  Package, ArrowRight, Sparkles,
} from "lucide-react";
import heroImage from "@/assets/hero-groceries.png";
import { useProducts } from "@/hooks/useProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCountdown, formatCountdown } from "@/hooks/useCountdown";
import { isSaleActive, getEffectivePrice, getDiscountPct } from "@/lib/promotions";
import { toast } from "sonner";

interface HeroCarouselProps {
  onStart: () => void;
  onProductClick?: (productId: string) => void;
}

const AUTOPLAY_MS = 5000;
const RESUME_MS = 5000;

const HeroCarousel = ({ onStart, onProductClick }: HeroCarouselProps) => {
  const { settings } = useStoreSettings();
  const cfg = settings.carousel_config;

  // Slide 1 is always enabled; 2 and 3 are toggleable.
  const slides = useMemo(() => {
    const list: Array<"s1" | "s2" | "s3"> = ["s1"];
    if (cfg.slide2.enabled) list.push("s2");
    if (cfg.slide3.enabled) list.push("s3");
    return list;
  }, [cfg.slide2.enabled, cfg.slide3.enabled]);
  const SLIDE_COUNT = slides.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Clamp index when slide count changes
  useEffect(() => {
    if (index >= SLIDE_COUNT) setIndex(0);
  }, [SLIDE_COUNT, index]);

  const goTo = useCallback((i: number) => setIndex(((i % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT), [SLIDE_COUNT]);
  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDE_COUNT), [SLIDE_COUNT]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDE_COUNT) % SLIDE_COUNT), [SLIDE_COUNT]);

  useEffect(() => {
    if (paused || SLIDE_COUNT < 2) return;
    const t = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [paused, next, SLIDE_COUNT]);

  const handleInteraction = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_MS);
  }, []);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    handleInteraction();
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchStartX.current = null;
  };

  const { products } = useProducts();
  const featured = useMemo(() => {
    const picked = cfg.slide2.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as typeof products;
    if (picked.length >= 1) return picked.slice(0, 3);
    const onSale = products.filter(isSaleActive).slice(0, 3);
    return onSale.length > 0 ? onSale : products.slice(0, 3);
  }, [cfg.slide2.productIds, products]);

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(cfg.slide3.coupon);
      setCopied(true);
      toast.success("Cupom copiado!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  // Render title with highlight word/phrase styled
  const renderHighlighted = (text: string, highlight: string, color: string) => {
    if (!highlight || !text.includes(highlight)) return text;
    const [before, ...rest] = text.split(highlight);
    const after = rest.join(highlight);
    return (
      <>
        {before}
        <span style={{ color }}>{highlight}</span>
        {after}
      </>
    );
  };

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      <div className="relative h-[320px] md:h-[460px] overflow-hidden">
        <div
          className="flex h-full transition-transform ease-[cubic-bezier(0.65,0,0.35,1)]"
          style={{ transform: `translateX(-${index * 100}%)`, transitionDuration: "850ms" }}
        >
          {slides.map((key) => {
            if (key === "s1") return <Slide1 key="s1" cfg={cfg.slide1} onStart={onStart} renderHighlighted={renderHighlighted} />;
            if (key === "s2") return <Slide2 key="s2" cfg={cfg.slide2} featured={featured} onStart={onStart} renderHighlighted={renderHighlighted} onProductClick={onProductClick} />;
            return <Slide3 key="s3" cfg={cfg.slide3} copied={copied} onCopy={copyCoupon} onStart={onStart} />;
          })}
        </div>

        {SLIDE_COUNT > 1 && (
          <>
            <button
              onClick={() => { handleInteraction(); prev(); }}
              aria-label="Slide anterior"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-md shadow-xl border border-white/50 items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={() => { handleInteraction(); next(); }}
              aria-label="Próximo slide"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-md shadow-xl border border-white/50 items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>

            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { handleInteraction(); goTo(i); }}
                  aria-label={`Ir para slide ${i + 1}`}
                  aria-current={index === i}
                  className={`h-2.5 rounded-full transition-all duration-500 ring-1 ring-white/30 ${
                    index === i ? "w-10 bg-white shadow-lg" : "w-2.5 bg-white/50 hover:bg-white/80 hover:scale-125"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

/* ============================ SLIDE 1 ============================ */
const Slide1 = ({
  cfg, onStart, renderHighlighted,
}: {
  cfg: ReturnType<typeof useStoreSettings>["settings"]["carousel_config"]["slide1"];
  onStart: () => void;
  renderHighlighted: (t: string, h: string, c: string) => React.ReactNode;
}) => {
  const features = [
    { Icon: Truck, title: cfg.feature1Title, text: cfg.feature1Text, color: "#00B894" },
    { Icon: ShieldCheck, title: cfg.feature2Title, text: cfg.feature2Text, color: "#1D2D50" },
    { Icon: Star, title: cfg.feature3Title, text: cfg.feature3Text, color: "#F59E0B" },
  ];
  return (
    <div
      className="min-w-full h-full relative px-4 md:px-8"
      style={{ background: "linear-gradient(135deg, #1D2D50 0%, #2C3E6B 100%)" }}
      aria-roledescription="slide"
    >
      <div className="container mx-auto h-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 md:gap-8">
        <div className="flex-1 text-center md:text-left text-white space-y-3 md:space-y-5 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs md:text-sm font-medium">
            <Truck className="h-3.5 w-3.5" /> {cfg.badge}
          </span>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            {renderHighlighted(cfg.title, cfg.highlight, "#00B894")}
          </h1>
          <p className="text-sm md:text-base text-white/80 max-w-md mx-auto md:mx-0">
            {cfg.subtitle}
          </p>
          <div className="hidden md:flex gap-4 pt-1">
            {features.map(({ Icon, title, text, color }) => (
              <div key={title} className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-lg bg-white/95 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="text-xs">
                  <p className="font-semibold">{title}</p>
                  <p className="text-white/70">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            size="lg"
            className="rounded-full font-semibold text-white shadow-lg hover:scale-[1.03] active:scale-[0.97] transition-transform"
            style={{ backgroundColor: "#00B894" }}
            onClick={onStart}
          >
            {cfg.ctaText}
          </Button>
        </div>
        {/* Product image card with hover lift & gradient border */}
        <div className="hidden md:block flex-1 max-w-sm group">
          <div
            className="relative p-[2px] rounded-2xl transition-all duration-300 group-hover:-translate-y-2 group-hover:rotate-[2deg]"
            style={{ background: "linear-gradient(135deg, #1D2D50, #00B894)" }}
          >
            <div
              className="rounded-2xl p-4 transition-shadow duration-300 group-hover:shadow-[0_25px_50px_-12px_rgba(0,184,148,0.45)]"
              style={{ background: "linear-gradient(135deg, #FAFBFC 0%, #F2F4F7 100%)" }}
            >
              <img
                src={cfg.image || heroImage}
                alt="Compras frescas"
                className="w-full h-auto rounded-xl"
                onError={(e) => { (e.target as HTMLImageElement).src = heroImage; }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================ SLIDE 2 ============================ */
const Slide2 = ({
  cfg, featured, onStart, renderHighlighted, onProductClick,
}: {
  cfg: ReturnType<typeof useStoreSettings>["settings"]["carousel_config"]["slide2"];
  featured: any[];
  onStart: () => void;
  renderHighlighted: (t: string, h: string, c: string) => React.ReactNode;
  onProductClick?: (id: string) => void;
}) => {
  const countdown = useCountdown(cfg.countdownEnd);
  return (
    <div
      className="min-w-full h-full relative px-4 md:px-8 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #FFF3E0 100%)" }}
      aria-roledescription="slide"
    >
      {/* Decorative confetti / shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full opacity-30 blur-3xl" style={{ background: "#FF8A4C" }} />
        <div className="absolute top-1/3 right-10 w-28 h-28 rounded-full opacity-25 blur-2xl" style={{ background: "#E53E3E" }} />
        <div className="absolute bottom-6 left-1/3 w-24 h-24 rotate-45 opacity-20" style={{ background: "linear-gradient(135deg,#FFB87A,#FF8A4C)" }} />
        {[
          { left: "8%", delay: "0s",   dur: "5s",   color: "#E53E3E" },
          { left: "22%", delay: "1.2s", dur: "6s",  color: "#FF8A4C" },
          { left: "38%", delay: "0.4s", dur: "5.5s",color: "#FFB87A" },
          { left: "55%", delay: "2s",   dur: "6.5s",color: "#E53E3E" },
          { left: "72%", delay: "0.8s", dur: "5s",  color: "#FF8A4C" },
          { left: "88%", delay: "1.6s", dur: "6s",  color: "#FFB87A" },
        ].map((c, i) => (
          <span
            key={i}
            className="absolute top-0 w-2 h-3 rounded-sm animate-confetti-fall"
            style={{ left: c.left, backgroundColor: c.color, animationDelay: c.delay, animationDuration: c.dur }}
          />
        ))}
      </div>

      <div className="container mx-auto h-full flex flex-col md:flex-row items-center gap-4 md:gap-8 relative">
        <div className="flex-1 text-center md:text-left space-y-2 md:space-y-4 max-w-md">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs md:text-sm font-semibold text-white shadow-lg animate-pulse"
            style={{ backgroundColor: "#E53E3E" }}
          >
            <Flame className="h-3.5 w-3.5 animate-bounce" /> {cfg.badge}
          </span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight" style={{ color: "#1D2D50" }}>
            {renderHighlighted(cfg.title, cfg.highlight, "#E53E3E")}
          </h2>
          {countdown.enabled && !countdown.expired && (
            <div className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono font-bold text-sm md:text-base shadow-sm"
              style={{ backgroundColor: "rgba(229,62,62,0.1)", color: "#E53E3E" }}>
              <Sparkles className="h-4 w-4" />
              Termina em: <span className="tabular-nums">{formatCountdown(countdown)}</span>
            </div>
          )}
          <p className="text-sm md:text-base text-muted-foreground">{cfg.subtitle}</p>
          <Button
            size="lg"
            className="rounded-full font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.05] active:scale-[0.97] transition-all w-full md:w-auto gap-2 group"
            style={{ backgroundColor: "#E53E3E" }}
            onClick={onStart}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C53030")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E53E3E")}
          >
            {cfg.ctaText}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
            {featured.slice(0, 1).map((p) => (<ProductMini key={p.id} product={p} onClick={onProductClick} />))}
            {featured.slice(1, 3).map((p) => (
              <div key={p.id} className="hidden md:block"><ProductMini product={p} onClick={onProductClick} /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================ SLIDE 3 ============================ */
const Slide3 = ({
  cfg, copied, onCopy, onStart,
}: {
  cfg: ReturnType<typeof useStoreSettings>["settings"]["carousel_config"]["slide3"];
  copied: boolean;
  onCopy: () => void;
  onStart: () => void;
}) => {
  return (
    <div
      className="min-w-full h-full relative px-4 md:px-8 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #00B894 0%, #00A381 100%)" }}
      aria-roledescription="slide"
    >
      {/* Decorative circles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "rgba(0,118,95,0.35)" }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full" style={{ background: "rgba(0,118,95,0.25)" }} />
        <div className="absolute top-12 left-10 w-16 h-16 rounded-full border-2 border-white/20" />
        <div className="absolute bottom-16 right-16 w-10 h-10 rotate-45 border-2 border-white/20" />
        {[
          { top: "15%", left: "20%", delay: "0s" },
          { top: "30%", left: "75%", delay: "0.8s" },
          { top: "70%", left: "15%", delay: "1.4s" },
          { top: "60%", left: "82%", delay: "0.4s" },
          { top: "20%", left: "55%", delay: "1.8s" },
        ].map((s, i) => (
          <Star
            key={i}
            className="absolute h-4 w-4 text-white/60 fill-white/40 animate-float-slow"
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          />
        ))}
      </div>

      <div className="container mx-auto h-full flex flex-col items-center justify-center text-center text-white gap-3 md:gap-5 max-w-2xl relative">
        <Gift className="h-7 w-7 md:h-8 md:w-8 text-white drop-shadow-md animate-float-slow" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs md:text-sm font-medium border border-white/30">
          <Sparkles className="h-3.5 w-3.5" /> {cfg.badge}
        </span>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight drop-shadow-md">
          {cfg.title}
        </h2>
        <p className="text-sm md:text-base text-white/90 max-w-md">
          Use o cupom <strong>{cfg.coupon}</strong> e ganhe desconto na sua primeira compra
        </p>
        <div className="flex items-center gap-2 bg-white rounded-full p-1 pl-4 shadow-2xl relative overflow-hidden">
          {/* Shimmer */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-shimmer" />
          <span className="font-mono font-bold text-base md:text-lg tracking-wider relative" style={{ color: "#00765F" }}>
            {cfg.coupon}
          </span>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white hover:scale-105 active:scale-95 transition-transform relative"
            style={{ backgroundColor: copied ? "#00B894" : "#1D2D50" }}
          >
            {copied ? <Check className="h-3.5 w-3.5 animate-badge-pop" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <p className="text-xs text-white/75">{cfg.conditions}</p>
        <Button
          size="lg"
          className="rounded-full font-semibold bg-white hover:bg-white hover:scale-[1.05] hover:shadow-2xl active:scale-[0.97] transition-all w-full md:w-auto max-w-xs"
          style={{ color: "#00765F" }}
          onClick={onStart}
        >
          {cfg.ctaText}
        </Button>
      </div>
    </div>
  );
};

/* ============================ ProductMini ============================ */
const ProductMini = ({ product, onClick }: { product: any; onClick?: (id: string) => void }) => {
  const onSale = isSaleActive(product);
  const price = getEffectivePrice(product);
  const pct = getDiscountPct(product);
  const [imgError, setImgError] = useState(false);
  const hasImage = Boolean(product.image) && !imgError;
  const clickable = Boolean(onClick);
  return (
    <button
      type="button"
      onClick={clickable ? () => onClick!(product.id) : undefined}
      className={`group bg-white rounded-xl shadow-md hover:shadow-2xl p-2 md:p-3 flex md:flex-col items-center gap-2 md:gap-2 relative h-20 md:h-[200px] border-2 border-transparent hover:border-orange-300 hover:-translate-y-1 active:scale-95 transition-all duration-300 text-left w-full ${clickable ? "cursor-pointer" : "cursor-default"}`}
    >
      {(onSale && pct > 0) && (
        <span
          className="absolute -top-2 -right-2 z-10 text-[10px] font-bold text-white px-2 py-1 rounded-full shadow-lg animate-badge-pop"
          style={{ backgroundColor: "#E53E3E" }}
        >
          -{pct}%
        </span>
      )}
      <div
        className="shrink-0 w-16 h-16 md:w-full md:h-[100px] rounded-lg flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: "#F5F5F5" }}
      >
        {hasImage ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <Package className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
      <div className="flex-1 md:flex-none md:text-center min-w-0 w-full">
        <p className="text-xs md:text-sm font-medium truncate" style={{ color: "#1D2D50" }}>{product.name}</p>
        <div className="flex md:justify-center items-baseline gap-1.5 mt-0.5">
          {onSale && (
            <span className="text-[10px] md:text-xs line-through text-muted-foreground">
              R$ {product.price.toFixed(2)}
            </span>
          )}
          <span className="text-sm md:text-base font-extrabold" style={{ color: "#00B894" }}>
            R$ {price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
