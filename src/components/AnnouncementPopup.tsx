import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Check, Tag, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface Banner {
  id: string;
  image_url: string;
  type: "coupon" | "promotion";
  coupon_code: string | null;
  link_url: string | null;
  title: string | null;
}

const STORAGE_KEY = "announcements_last_seen";

const shouldShowToday = () => {
  try {
    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) return true;
    const lastDate = new Date(last);
    const now = new Date();
    return lastDate.toDateString() !== now.toDateString();
  } catch {
    return true;
  }
};

const AnnouncementPopup = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!shouldShowToday()) return;
    initializedRef.current = true;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("announcement_banners")
        .select("id,image_url,type,coupon_code,link_url,title")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .limit(10);
      if (cancelled || error) return;
      const list = (data as Banner[]) ?? [];
      if (list.length > 0) {
        setBanners(list);
        setOpen(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleClose = useCallback((value: boolean) => {
    setOpen(value);
    if (!value) {
      try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch {}
    }
  }, []);

  const current = banners[index];

  const handleCopy = useCallback(async () => {
    if (!current?.coupon_code) return;
    const code = current.coupon_code;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Cupom copiado! ✓", { style: { color: "#00B894" } });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
    // Registra o resgate no banco (silencioso, só para usuários logados)
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;
      const { data: coupon } = await supabase
        .from("coupons")
        .select("id")
        .ilike("code", code)
        .maybeSingle();
      if (!coupon?.id) return;
      await supabase
        .from("user_redeemed_coupons")
        .upsert(
          { user_id: userId, coupon_id: coupon.id },
          { onConflict: "user_id,coupon_id", ignoreDuplicates: true }
        );
    } catch {
      // ignora silenciosamente
    }
  }, [current]);

  const handleAction = useCallback(() => {
    if (!current) return;
    handleClose(false);
    if (current.link_url) {
      if (current.link_url.startsWith("http")) {
        window.open(current.link_url, "_blank", "noopener");
      } else {
        navigate(current.link_url);
      }
    } else {
      navigate("/?categoria=promocoes");
    }
  }, [current, handleClose, navigate]);

  if (!current) return null;

  const isCoupon = current.type === "coupon";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)" }}
        />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] overflow-hidden bg-background focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300"
          style={{
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <DialogPrimitive.Title asChild>
            <VisuallyHidden>Anúncios e promoções</VisuallyHidden>
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {isCoupon ? "Cupom de desconto disponível" : "Promoção em destaque"}
          </DialogPrimitive.Description>

          <div className="relative bg-muted">
            <img
              src={current.image_url}
              alt={current.title || "Anúncio"}
              className="w-full h-auto object-contain"
            />

            <DialogPrimitive.Close
              aria-label="Fechar"
              className="absolute right-3 top-3 h-9 w-9 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </DialogPrimitive.Close>

            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 transition-transform hover:scale-110"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIndex((i) => (i + 1) % banners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 transition-transform hover:scale-110"
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? "w-6 bg-primary" : "w-1.5 bg-background/70"
                      }`}
                      aria-label={`Banner ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="p-6 space-y-4">
            {current.title && (
              <div className="space-y-1">
                <h3
                  className="font-display font-extrabold text-xl text-foreground uppercase"
                  style={{ letterSpacing: "0.05em" }}
                >
                  {current.title}
                </h3>
              </div>
            )}
            {isCoupon && current.coupon_code ? (
              <>
                <div
                  className="flex items-center justify-center gap-2.5 rounded-xl px-4 py-3.5"
                  style={{
                    border: "1px solid #00B894",
                    backgroundColor: "rgba(0,184,148,0.08)",
                  }}
                >
                  <Tag className="h-4 w-4" style={{ color: "#00B894" }} />
                  <span
                    className="font-mono font-bold text-lg"
                    style={{ letterSpacing: "0.15em", color: "#0a5c4a" }}
                  >
                    {current.coupon_code}
                  </span>
                </div>
                <Button
                  onClick={handleCopy}
                  className="w-full gap-2 h-11 font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                  style={{
                    backgroundColor: "#00B894",
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(0,184,148,0.3)",
                  }}
                >
                  {copied ? <><Check className="h-4 w-4" /> Copiado! ✓</> : <><Copy className="h-4 w-4" /> Copiar cupom</>}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAction}
                className="w-full gap-2 h-11 font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                style={{
                  backgroundColor: "#1D2D50",
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(29,45,80,0.3)",
                }}
              >
                <Sparkles className="h-4 w-4" /> Ver ofertas
              </Button>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default AnnouncementPopup;
