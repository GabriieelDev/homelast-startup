export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  section: string[];
  unit: string;
}

export const categories = [
  { id: "all", label: "Todos", icon: "🛒" },
  { id: "mercearia", label: "Mercearia", icon: "🏪" },
  { id: "bebidas", label: "Bebidas", icon: "🥤" },
  { id: "limpeza", label: "Limpeza", icon: "🧹" },
  { id: "higiene", label: "Higiene", icon: "🧴" },
];

// Imagens reais e específicas por produto (fundo neutro, alta qualidade)
export const products: Product[] = [
  { id: "2", name: "Arroz Integral 5kg", price: 24.90, originalPrice: 29.90, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop&q=80", category: "mercearia", section: ["mais-comprados", "promocoes"], unit: "un" },
  { id: "3", name: "Leite Integral 1L", price: 5.49, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop&q=80", category: "bebidas", section: ["mais-comprados", "frequentes"], unit: "un" },
  { id: "6", name: "Coca-Cola 2L", price: 9.99, originalPrice: 11.99, image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop&q=80", category: "bebidas", section: ["promocoes", "mais-comprados"], unit: "un" },
  { id: "8", name: "Detergente Ypê", price: 2.49, originalPrice: 3.99, image: "https://images.unsplash.com/photo-1622503043418-7ed81ea2c5d4?w=400&h=400&fit=crop&q=80", category: "limpeza", section: ["promocoes", "frequentes"], unit: "un" },
  { id: "10", name: "Café Pilão 500g", price: 15.90, originalPrice: 19.90, image: "https://images.unsplash.com/photo-1559525839-d9acfd1ed2dc?w=400&h=400&fit=crop&q=80", category: "mercearia", section: ["promocoes", "mais-comprados"], unit: "un" },
  { id: "11", name: "Sabonete Dove", price: 3.99, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop&q=80", category: "higiene", section: ["recomendados", "mais-comprados"], unit: "un" },
  { id: "16", name: "Água Mineral 1.5L", price: 2.99, image: "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&h=400&fit=crop&q=80", category: "bebidas", section: ["frequentes", "mais-comprados"], unit: "un" },
  { id: "18", name: "Azeite Extra Virgem", price: 22.90, originalPrice: 28.90, image: "https://images.unsplash.com/photo-1601300576487-fb00b5856cea?w=400&h=400&fit=crop&q=80", category: "mercearia", section: ["promocoes", "recomendados"], unit: "un" },
  { id: "20", name: "Papel Higiênico 12un", price: 16.90, originalPrice: 21.90, image: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&h=400&fit=crop&q=80", category: "higiene", section: ["promocoes", "frequentes"], unit: "pct" },
  { id: "21", name: "Macarrão Espaguete 500g", price: 4.49, image: "https://images.unsplash.com/photo-1612966769900-2358d6131e53?w=400&h=400&fit=crop&q=80", category: "mercearia", section: ["frequentes", "mais-comprados"], unit: "un" },
  { id: "22", name: "Óleo de Soja 900ml", price: 7.99, originalPrice: 9.99, image: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=400&h=400&fit=crop&q=80", category: "mercearia", section: ["promocoes", "frequentes"], unit: "un" },
  { id: "23", name: "Suco de Laranja 1L", price: 6.99, image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop&q=80", category: "bebidas", section: ["recomendados", "frequentes"], unit: "un" },
  { id: "24", name: "Desinfetante 2L", price: 5.99, originalPrice: 7.99, image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400&h=400&fit=crop&q=80", category: "limpeza", section: ["promocoes", "recomendados"], unit: "un" },
  { id: "25", name: "Shampoo Pantene 400ml", price: 18.90, originalPrice: 24.90, image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop&q=80", category: "higiene", section: ["promocoes", "recomendados"], unit: "un" },
  { id: "26", name: "Açúcar Refinado 1kg", price: 4.99, image: "https://images.unsplash.com/photo-1610137544866-99c0dc7d3b1c?w=400&h=400&fit=crop&q=80", category: "mercearia", section: ["mais-comprados", "frequentes"], unit: "un" },
  { id: "27", name: "Cerveja Heineken 350ml", price: 4.99, originalPrice: 6.49, image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop&q=80", category: "bebidas", section: ["promocoes", "mais-comprados"], unit: "un" },
  { id: "28", name: "Sabão em Pó Omo 1kg", price: 12.90, image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=400&fit=crop&q=80", category: "limpeza", section: ["mais-comprados", "frequentes"], unit: "un" },
  { id: "29", name: "Creme Dental Colgate 90g", price: 5.49, image: "https://images.unsplash.com/photo-1559591937-abc3a5b1d9a0?w=400&h=400&fit=crop&q=80", category: "higiene", section: ["frequentes", "recomendados"], unit: "un" },
  { id: "30", name: "Feijão Carioca 1kg", price: 8.90, originalPrice: 10.90, image: "https://images.unsplash.com/photo-1622542796254-5b9c46ab0d2f?w=400&h=400&fit=crop&q=80", category: "mercearia", section: ["mais-comprados", "promocoes"], unit: "un" },
];
