import { useState, useCallback } from "react";
import { Product } from "@/data/products";
import { toast } from "sonner";

export interface CartItem {
  product: Product;
  quantity: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

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

  return { items, addItem, removeItem, getQuantity, totalItems, totalPrice, clearCart };
}
