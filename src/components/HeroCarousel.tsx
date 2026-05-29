import { useEffect, useRef, useState, useCallback, TouchEvent } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Truck, ShieldCheck, Star, Flame, Gift, Copy, Check, Package } from "lucide-react";
import heroImage from "@/assets/hero-groceries.png";
import { useProducts } from "@/hooks/useProducts";
import { isSaleActive, getEffectivePrice, getDiscountPct } from "@/lib/promotions";
import { toast } from "sonner";

interface HeroCarouselProps {
  onStart: () => void;
}

const SLIDE_COUNT = 3;
const AUTOPLAY_MS = 5000;
const RESUME_MS = 5000;

const HeroCarousel = ({ onStart }: HeroCarouselProps) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((i: number) => {
    setIndex(((i % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
  }, []);
  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDE_COUNT), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDE_COUNT) % SLIDE_COUNT), []);

  // Autoplay
  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [paused, next]);

  const handleInteraction = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_MS);
  }, []);

  // Touch swipe
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

  // Sale products for slide 2
  const { products } = useProducts();
  const saleProducts = products.filter(isSaleActive).slice(0, 3);
  const fallback = products.slice(0, 3);
  const featured = saleProducts.length > 0 ? saleProducts : fallback;

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText("BEMVINDO10");
      setCopied(true);
      toast.success("Cupom copiado!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
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
      {/* Track */}
      <div className="relative h-[280px] md:h-[420px] overflow-hidden">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {/* SLIDE 1 — Apresentação */}
          <div
            className="min-w-full h-full relative px-4 md:px-8"
            style={{ background: "linear-gradient(135deg, #1D2D50 0%, #2C3E6B 100%)" }}
            aria-roledescription="slide"
            aria-label="Slide 1 de 3"
          >
            <div className="container mx-auto h-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 md:gap-8">
              <div className="flex-1 text-center md:text-left text-white space-y-3 md:space-y-5 max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs md:text-sm font-medium">
                  <Truck className="h-3.5 w-3.5" /> Entrega em 30–60 min
                </span>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                  Seu supermercado <span style={{ color: "#00B894" }}>em minutos</span>
                </h1>
                <p className="text-sm md:text-base text-white/80 max-w-md mx-auto md:mx-0">
                  Compre rápido, receba rápido. Sem filas, sem complicação.
                </p>
                <div className="hidden md:flex gap-4 pt-1">
                  {[
                    { Icon: Truck, title: "Entrega expressa", text: "Receba em até 1 hora" },
                    { Icon: ShieldCheck, title: "Compra segura", text: "Pagamento protegido" },
                    { Icon: Star, title: "Qualidade garantida", text: "Produtos frescos" },
                  ].map(({ Icon, title, text }) => (
                    <div key={title} className="flex items-start gap-2">
                      <div className="w-9 h-9 rounded-lg bg-white/95 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" style={{ color: "#00B894" }} />
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
                  Começar agora
                </Button>
              </div>
              <div className="hidden md:block flex-1 max-w-sm">
                <img src={heroImage} alt="Compras frescas" className="w-full h-auto rounded-2xl shadow-2xl" />
              </div>
            </div>
          </div>

          {/* SLIDE 2 — Produtos em promoção */}
          <div
            className="min-w-full h-full relative px-4 md:px-8"
            style={{ backgroundColor: "#F8F9FA" }}
            aria-roledescription="slide"
            aria-label="Slide 2 de 3"
          >
            <div className="container mx-auto h-full flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex-1 text-center md:text-left space-y-2 md:space-y-4 max-w-md">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs md:text-sm font-semibold text-white" style={{ backgroundColor: "#E74C3C" }}>
                  <Flame className="h-3.5 w-3.5" /> Ofertas do dia
                </span>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight" style={{ color: "#1D2D50" }}>
                  Produtos com até <span style={{ color: "#00B894" }}>30% OFF</span>
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Aproveite as melhores ofertas antes que acabem!
                </p>
                <Button
                  size="lg"
                  className="rounded-full font-semibold text-white hover:scale-[1.03] active:scale-[0.97] transition-transform w-full md:w-auto"
                  style={{ backgroundColor: "#1D2D50" }}
                  onClick={onStart}
                >
                  Ver todas as ofertas
                </Button>
              </div>
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                  {featured.slice(0, 1).map((p) => (
                    <ProductMini key={p.id} product={p} />
                  ))}
                  {featured.slice(1, 3).map((p) => (
                    <div key={p.id} className="hidden md:block">
                      <ProductMini product={p} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 3 — Cupom */}
          <div
            className="min-w-full h-full relative px-4 md:px-8"
            style={{ background: "linear-gradient(135deg, #00B894 0%, #00A381 100%)" }}
            aria-roledescription="slide"
            aria-label="Slide 3 de 3"
          >
            <div className="container mx-auto h-full flex flex-col items-center justify-center text-center text-white gap-3 md:gap-5 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs md:text-sm font-medium">
                <Gift className="h-3.5 w-3.5" /> Oferta especial
              </span>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Primeira compra com 10% OFF
              </h2>
              <p className="text-sm md:text-base text-white/90 max-w-md">
                Use o cupom <strong>BEMVINDO10</strong> e ganhe desconto na sua primeira compra
              </p>
              <div className="flex items-center gap-2 bg-white rounded-full p-1 pl-4 shadow-xl">
                <span className="font-mono font-bold text-base md:text-lg tracking-wider" style={{ color: "#00765F" }}>
                  BEMVINDO10
                </span>
                <button
                  onClick={copyCoupon}
                  className="flex items-center gap-1.5 rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white hover:scale-[1.03] active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: "#1D2D50" }}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <p className="text-xs text-white/75">Válido para novos clientes. Pedido mínimo R$ 50.</p>
              <Button
                size="lg"
                className="rounded-full font-semibold bg-white hover:bg-white hover:scale-[1.03] active:scale-[0.97] transition-transform w-full md:w-auto max-w-xs"
                style={{ color: "#00765F" }}
                onClick={onStart}
              >
                Aproveitar agora
              </Button>
            </div>
          </div>
        </div>

        {/* Arrows (desktop) */}
        <button
          onClick={() => { handleInteraction(); prev(); }}
          aria-label="Slide anterior"
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 hover:bg-white shadow-lg items-center justify-center hover:scale-[1.03] active:scale-[0.97] transition-transform z-10"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={() => { handleInteraction(); next(); }}
          aria-label="Próximo slide"
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 hover:bg-white shadow-lg items-center justify-center hover:scale-[1.03] active:scale-[0.97] transition-transform z-10"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => { handleInteraction(); goTo(i); }}
              aria-label={`Ir para slide ${i + 1}`}
              aria-current={index === i}
              className={`h-2 rounded-full transition-all ${
                index === i ? "w-7 bg-white" : "w-2 bg-white/55 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProductMini = ({ product }: { product: any }) => {
  const onSale = isSaleActive(product);
  const price = getEffectivePrice(product);
  const pct = getDiscountPct(product);
  const [imgError, setImgError] = useState(false);
  const hasImage = Boolean(product.image) && !imgError;
  return (
    <div className="bg-white rounded-xl shadow-md p-2 md:p-3 flex md:flex-col items-center gap-2 md:gap-2 relative h-20 md:h-[180px]">
      {onSale && pct > 0 && (
        <span className="absolute top-1 right-1 z-10 text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: "#E74C3C" }}>
          -{pct}%
        </span>
      )}
      <div
        className="shrink-0 w-16 h-16 md:w-full md:h-[90px] rounded-lg flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: "#F5F5F5" }}
      >
        {hasImage ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="max-w-full max-h-full object-contain"
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
          <span className="text-sm md:text-base font-bold" style={{ color: "#00B894" }}>
            R$ {price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
