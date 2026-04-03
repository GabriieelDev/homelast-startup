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

export const products: Product[] = [
  { id: "2", name: "Arroz Integral 5kg", price: 24.90, originalPrice: 29.90, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop", category: "mercearia", section: ["mais-comprados", "promocoes"], unit: "un" },
  { id: "3", name: "Leite Integral 1L", price: 5.49, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop", category: "bebidas", section: ["mais-comprados", "frequentes"], unit: "un" },
  { id: "6", name: "Coca-Cola 2L", price: 9.99, originalPrice: 11.99, image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop", category: "bebidas", section: ["promocoes", "mais-comprados"], unit: "un" },
  { id: "8", name: "Detergente Ypê", price: 2.49, originalPrice: 3.99, image: "https://images.unsplash.com/photo-1585441695325-21557ef34614?w=300&h=300&fit=crop", category: "limpeza", section: ["promocoes", "frequentes"], unit: "un" },
  { id: "10", name: "Café Pilão 500g", price: 15.90, originalPrice: 19.90, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop", category: "mercearia", section: ["promocoes", "mais-comprados"], unit: "un" },
  { id: "11", name: "Sabonete Dove", price: 3.99, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300&h=300&fit=crop", category: "higiene", section: ["recomendados", "mais-comprados"], unit: "un" },
  { id: "16", name: "Água Mineral 1.5L", price: 2.99, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop", category: "bebidas", section: ["frequentes", "mais-comprados"], unit: "un" },
  { id: "18", name: "Azeite Extra Virgem", price: 22.90, originalPrice: 28.90, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop", category: "mercearia", section: ["promocoes", "recomendados"], unit: "un" },
  { id: "20", name: "Papel Higiênico 12un", price: 16.90, originalPrice: 21.90, image: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=300&h=300&fit=crop", category: "higiene", section: ["promocoes", "frequentes"], unit: "pct" },
  { id: "21", name: "Macarrão Espaguete 500g", price: 4.49, image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&h=300&fit=crop", category: "mercearia", section: ["frequentes", "mais-comprados"], unit: "un" },
  { id: "22", name: "Óleo de Soja 900ml", price: 7.99, originalPrice: 9.99, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop", category: "mercearia", section: ["promocoes", "frequentes"], unit: "un" },
  { id: "23", name: "Suco de Laranja 1L", price: 6.99, image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&h=300&fit=crop", category: "bebidas", section: ["recomendados", "frequentes"], unit: "un" },
  { id: "24", name: "Desinfetante 2L", price: 5.99, originalPrice: 7.99, image: "https://images.unsplash.com/photo-1585441695325-21557ef34614?w=300&h=300&fit=crop", category: "limpeza", section: ["promocoes", "recomendados"], unit: "un" },
  { id: "25", name: "Shampoo Pantene 400ml", price: 18.90, originalPrice: 24.90, image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=300&h=300&fit=crop", category: "higiene", section: ["promocoes", "recomendados"], unit: "un" },
  { id: "26", name: "Açúcar Refinado 1kg", price: 4.99, image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&h=300&fit=crop", category: "mercearia", section: ["mais-comprados", "frequentes"], unit: "un" },
  { id: "27", name: "Cerveja Heineken 350ml", price: 4.99, originalPrice: 6.49, image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&h=300&fit=crop", category: "bebidas", section: ["promocoes", "mais-comprados"], unit: "un" },
  { id: "28", name: "Sabão em Pó Omo 1kg", price: 12.90, image: "https://images.unsplash.com/photo-1585441695325-21557ef34614?w=300&h=300&fit=crop", category: "limpeza", section: ["mais-comprados", "frequentes"], unit: "un" },
  { id: "29", name: "Creme Dental Colgate 90g", price: 5.49, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop", category: "higiene", section: ["frequentes", "recomendados"], unit: "un" },
  { id: "30", name: "Feijão Carioca 1kg", price: 8.90, originalPrice: 10.90, image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&h=300&fit=crop", category: "mercearia", section: ["mais-comprados", "promocoes"], unit: "un" },
];
