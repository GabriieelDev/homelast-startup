import { useState, useCallback, useEffect } from "react";
import { Product, products as PRODUCT_CATALOG } from "@/data/products";
import { toast } from "sonner";

export interface CartItem {
  product: Product;
  quantity: number;
}

const STORAGE_KEY = "servbem.cart.v1";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: { id: string; quantity: number }[] = JSON.parse(raw);
      return parsed
        .map((p) => {
          const product = PRODUCT_CATALOG.find((x) => x.id === p.id);
          return product ? { product, quantity: p.quantity } : null;
        })
        .filter(Boolean) as CartItem[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items.map((i) => ({ id: i.product.id, quantity: i.quantity })))
      );
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = useCallback((product: Product, maxStock: number = 99) => {
    let added = false;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= maxStock) {
          toast.error(`Estoque máximo atingido (${maxStock})`);
          return prev;
        }
        added = true;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (maxStock <= 0) {
        toast.error("Produto indisponível");
        return prev;
      }
      added = true;
      return [...prev, { product, quantity: 1 }];
    });
    if (added) toast.success("Produto adicionado ao carrinho 🛒", { duration: 1500 });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.product.id !== productId);
    });
  }, []);

  const getQuantity = useCallback(
    (productId: string) => items.find((i) => i.product.id === productId)?.quantity || 0,
    [items]
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const clearCart = useCallback(() => setItems([]), []);

  /** Replace cart with a list of product IDs + quantities (used by "Comprar novamente"). */
  const setCartFromIds = useCallback((entries: { id: string; quantity: number }[]) => {
    const next: CartItem[] = entries
      .map((e) => {
        const product = PRODUCT_CATALOG.find((p) => p.id === e.id);
        return product ? { product, quantity: Math.max(1, e.quantity) } : null;
      })
      .filter(Boolean) as CartItem[];
    setItems(next);
    if (next.length) toast.success("Itens adicionados ao carrinho 🛒");
    else toast.error("Os produtos deste pedido não estão mais disponíveis");
  }, []);

  return { items, addItem, removeItem, getQuantity, totalItems, totalPrice, clearCart, setCartFromIds };
}
