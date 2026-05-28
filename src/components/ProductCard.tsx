import { memo } from "react";
import { Plus, Minus, AlertTriangle, Trash2 } from "lucide-react";
import { Product } from "@/data/products";
import { isSaleActive, getEffectivePrice, getSaleBadgeLabel, getSavings } from "@/lib/promotions";
import SaleCountdown from "@/components/SaleCountdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  stock?: number;
  isAdmin?: boolean;
  onDisable?: () => void;
}

const ProductCard = ({ product, quantity, onAdd, onRemove, stock = 99, isAdmin, onDisable }: ProductCardProps) => {
  const unavailable = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;
  const reachedMax = quantity >= stock;
  const onSale = isSaleActive(product);
  const effectivePrice = getEffectivePrice(product);
  const savings = getSavings(product);
  const legacyDiscount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      className={`group relative bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 ${
        onSale ? "border-accent/50 ring-1 ring-accent/20" : "border-border"
      }`}
    >
      {onSale ? (
        <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md">
          {getSaleBadgeLabel(product)}
        </div>
      ) : legacyDiscount > 0 && !unavailable ? (
        <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          -{legacyDiscount}%
        </div>
      ) : null}
      {unavailable && (
        <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          Indisponível
        </div>
      )}
      {lowStock && (
        <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Últimas {stock}
        </div>
      )}
      {isAdmin && onDisable && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="absolute bottom-2 right-2 z-10 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
              title="Remover produto"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover este produto?</AlertDialogTitle>
              <AlertDialogDescription>
                "{product.name}" será desativado e deixará de aparecer para os clientes. Você poderá reativá-lo depois pelo painel admin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDisable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <div className={`aspect-square overflow-hidden bg-white p-2 ${unavailable ? "opacity-50 grayscale" : ""}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-end gap-1.5 min-h-[1.75rem]">
          {onSale ? (
            <>
              <span className="text-lg font-bold text-accent">R$ {effectivePrice.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground line-through">R$ {product.price.toFixed(2)}</span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-primary">R$ {product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">R$ {product.originalPrice.toFixed(2)}</span>
              )}
            </>
          )}
        </div>
        {onSale && (
          <div className="space-y-0.5">
            {savings > 0 && (
              <p className="text-[11px] text-accent font-semibold">Economize R$ {savings.toFixed(2)}</p>
            )}
            {product.saleEnd && <SaleCountdown end={product.saleEnd} />}
          </div>
        )}
        <div className="pt-1">
          {unavailable ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-1.5 bg-muted text-muted-foreground rounded-lg py-2.5 font-semibold text-sm cursor-not-allowed"
            >
              Indisponível
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold text-sm hover:bg-primary/90 transition-colors active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          ) : (
            <div className="flex items-center justify-between bg-primary/10 rounded-lg overflow-hidden animate-pop-in">
              <button
                onClick={onRemove}
                className="flex items-center justify-center h-10 w-10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-bold text-primary text-sm">{quantity}</span>
              <button
                onClick={onAdd}
                disabled={reachedMax}
                className="flex items-center justify-center h-10 w-10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(ProductCard, (prev, next) =>
  prev.product === next.product &&
  prev.quantity === next.quantity &&
  prev.stock === next.stock &&
  prev.isAdmin === next.isAdmin &&
  Boolean(prev.onDisable) === Boolean(next.onDisable)
);
