// Product type + categories. The actual catalog now lives in the `products`
// table on the backend and is fetched via `useProducts()`. This file is kept
// for type compatibility and the static category list.

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  section: string[];
  unit: string;
  description?: string;
  active?: boolean;
  costPrice?: number;
  // Promotion fields
  onSale?: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  salePrice?: number;
  saleStart?: string | null;
  saleEnd?: string | null;
  saleLabel?: string | null;
}

export const categories = [
  { id: "all", label: "Todos", icon: "🛒" },
  { id: "mercearia", label: "Mercearia", icon: "🏪" },
  { id: "bebidas", label: "Bebidas", icon: "🥤" },
  { id: "limpeza", label: "Limpeza", icon: "🧹" },
  { id: "higiene", label: "Higiene", icon: "🧴" },
];

// Empty fallback for legacy imports — real data comes from useProducts().
export const products: Product[] = [];
