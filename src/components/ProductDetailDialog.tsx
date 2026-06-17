import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Plus, Minus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Product } from "@/data/products";
import { isSaleActive, getEffectivePrice, getSaleBadgeLabel } from "@/lib/promotions";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock?: number;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

const ProductDetailDialog = ({ product, open, onOpenChange, stock = 99, quantity, onAdd, onRemove }: Props) => {
  const [imgError, setImgError] = useState(false);
  const { track } = useRecentlyViewed();

  useEffect(() => { if (open && product) { track(product.id); setImgError(false); } }, [open, product, track]);

  if (!product) return null;
  const onSale = isSaleActive(product);
  const price = getEffectivePrice(product);
  const unavailable = stock <= 0;
  const hasImage = Boolean(product.image) && !imgError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-left">{product.name}</DialogTitle>
          <DialogDescription className="sr-only">Detalhes do produto {product.name}, preço e opções para adicionar ao carrinho.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-xl flex items-center justify-center overflow-hidden bg-[#F5F5F5] dark:bg-muted">
            {hasImage ? (
              <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" onError={() => setImgError(true)} />
            ) : (
              <Package className="h-16 w-16 text-muted-foreground/50" />
            )}
          </div>

          <div className="flex items-end gap-2 flex-wrap">
            {onSale ? (
              <>
                <span className="text-2xl font-bold text-accent">R$ {price.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">R$ {product.price.toFixed(2)}</span>
                <span className="text-xs font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">{getSaleBadgeLabel(product)}</span>
              </>
            ) : (
              <span className="text-2xl font-bold text-primary">R$ {product.price.toFixed(2)}</span>
            )}
            <span className="text-xs text-muted-foreground">/ {product.unit}</span>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {unavailable ? (
            <Button disabled className="w-full">Indisponível</Button>
          ) : quantity === 0 ? (
            <Button onClick={onAdd} className="w-full gap-2" style={{ backgroundColor: "#00B894", color: "white" }}>
              <ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho
            </Button>
          ) : (
            <div className="flex items-center justify-between bg-primary/10 rounded-lg overflow-hidden">
              <button onClick={onRemove} className="flex items-center justify-center h-12 w-14 text-primary hover:bg-primary/20"><Minus className="h-4 w-4" /></button>
              <span className="font-bold text-primary">{quantity} no carrinho</span>
              <button onClick={onAdd} disabled={quantity >= stock} className="flex items-center justify-center h-12 w-14 text-primary hover:bg-primary/20 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
