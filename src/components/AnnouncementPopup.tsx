import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Check, Tag, Sparkles } from "lucide-react";
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
    try {
      await navigator.clipboard.writeText(current.coupon_code);
      setCopied(true);
      toast.success(`Cupom ${current.coupon_code} copiado!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogTitle asChild>
          <VisuallyHidden>Anúncios e promoções</VisuallyHidden>
        </DialogTitle>
        <DialogDescription className="sr-only">
          {current.type === "cupom" ? "Cupom de desconto disponível" : "Promoção em destaque"}
        </DialogDescription>

        <div className="relative aspect-[4/3] bg-muted">
          <img
            src={current.image_url}
            alt={current.title || "Anúncio"}
            className="w-full h-full object-cover"
          />
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

        <div className="p-5 space-y-3">
          {current.title && (
            <h3 className="font-bold text-lg text-foreground">{current.title}</h3>
          )}
          {current.type === "cupom" && current.coupon_code ? (
            <>
              <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="font-mono font-bold text-lg tracking-wider">{current.coupon_code}</span>
                </div>
              </div>
              <Button
                onClick={handleCopy}
                className="w-full gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                variant={copied ? "secondary" : "default"}
              >
                {copied ? <><Check className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar código</>}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleAction}
              className="w-full gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" /> Ver ofertas
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementPopup;
