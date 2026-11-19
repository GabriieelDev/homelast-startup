import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { ShoppingBasket } from "lucide-react";
import { isUsableImageUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  /** Prop em camelCase aceita pelo React 18 é emitida como atributo minúsculo "fetchpriority". */
  fetchpriority?: "high" | "low" | "auto";
};

/**
 * <img> de produto com fallback: se a URL for vazia/do host antigo ou o carregamento falhar,
 * mostra um placeholder neutro ocupando o mesmo espaço (mesma className/width/height).
 */
export function ProductImage({ src, alt = "", className, fetchpriority, onError, ...rest }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!isUsableImageUrl(src) || failed) {
    return (
      <div
        role="img"
        aria-label={alt || "Produto sem imagem"}
        style={{ width: rest.width as number | string | undefined, height: rest.height as number | string | undefined }}
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-400 dark:bg-muted dark:text-muted-foreground",
          className,
          "!scale-100 !p-0 !object-none",
        )}
      >
        <ShoppingBasket className="h-1/2 w-1/2 max-h-10 max-w-10" aria-hidden />
      </div>
    );
  }

  const extra = fetchpriority ? ({ fetchpriority } as Record<string, string>) : {};
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...extra}
      {...rest}
    />
  );
}

export default ProductImage;
