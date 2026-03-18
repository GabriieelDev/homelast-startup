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
  { id: "hortifruti", label: "Hortifrúti", icon: "🥬" },
  { id: "mercearia", label: "Mercearia", icon: "🏪" },
  { id: "bebidas", label: "Bebidas", icon: "🥤" },
  { id: "limpeza", label: "Limpeza", icon: "🧹" },
  { id: "higiene", label: "Higiene", icon: "🧴" },
  { id: "congelados", label: "Congelados", icon: "🧊" },
  { id: "petshop", label: "Pet Shop", icon: "🐾" },
  { id: "bebes", label: "Bebês", icon: "👶" },
  { id: "acougue", label: "Açougue", icon: "🥩" },
  { id: "padaria", label: "Padaria", icon: "🍞" },
];

export const products: Product[] = [
  { id: "1", name: "Banana Prata", price: 4.99, image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop", category: "hortifruti", section: ["mais-comprados", "frequentes"], unit: "kg" },
  { id: "2", name: "Arroz Integral 5kg", price: 24.90, originalPrice: 29.90, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop", category: "mercearia", section: ["mais-comprados", "promocoes"], unit: "un" },
  { id: "3", name: "Leite Integral 1L", price: 5.49, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop", category: "bebidas", section: ["mais-comprados", "frequentes"], unit: "un" },
  { id: "4", name: "Tomate Italiano", price: 8.99, originalPrice: 12.99, image: "https://images.unsplash.com/photo-1546470427-e26264be0b11?w=300&h=300&fit=crop", category: "hortifruti", section: ["promocoes", "recomendados"], unit: "kg" },
  { id: "5", name: "Pão Francês", price: 14.90, image: "https://images.unsplash.com/photo-1549931319-a545753467c8?w=300&h=300&fit=crop", category: "padaria", section: ["mais-comprados", "frequentes"], unit: "kg" },
  { id: "6", name: "Coca-Cola 2L", price: 9.99, originalPrice: 11.99, image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop", category: "bebidas", section: ["promocoes", "mais-comprados"], unit: "un" },
  { id: "7", name: "Frango Peito", price: 16.90, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=300&h=300&fit=crop", category: "acougue", section: ["mais-comprados", "recomendados"], unit: "kg" },
  { id: "8", name: "Detergente Ypê", price: 2.49, originalPrice: 3.99, image: "https://images.unsplash.com/photo-1585441695325-21557ef34614?w=300&h=300&fit=crop", category: "limpeza", section: ["promocoes", "frequentes"], unit: "un" },
  { id: "9", name: "Maçã Fuji", price: 9.90, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop", category: "hortifruti", section: ["recomendados", "frequentes"], unit: "kg" },
  { id: "10", name: "Café Pilão 500g", price: 15.90, originalPrice: 19.90, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop", category: "mercearia", section: ["promocoes", "mais-comprados"], unit: "un" },
  { id: "11", name: "Sabonete Dove", price: 3.99, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300&h=300&fit=crop", category: "higiene", section: ["recomendados"], unit: "un" },
  { id: "12", name: "Pizza Congelada", price: 18.90, originalPrice: 24.90, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop", category: "congelados", section: ["promocoes", "recomendados"], unit: "un" },
  { id: "13", name: "Ração Golden 15kg", price: 89.90, image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300&h=300&fit=crop", category: "petshop", section: ["recomendados"], unit: "un" },
  { id: "14", name: "Fralda Pampers M", price: 49.90, originalPrice: 64.90, image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop", category: "bebes", section: ["promocoes"], unit: "pct" },
  { id: "15", name: "Cebola Branca", price: 5.99, image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&h=300&fit=crop", category: "hortifruti", section: ["frequentes"], unit: "kg" },
  { id: "16", name: "Água Mineral 1.5L", price: 2.99, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop", category: "bebidas", section: ["frequentes", "mais-comprados"], unit: "un" },
  { id: "17", name: "Queijo Mussarela", price: 34.90, image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&h=300&fit=crop", category: "acougue", section: ["recomendados", "frequentes"], unit: "kg" },
  { id: "18", name: "Azeite Extra Virgem", price: 22.90, originalPrice: 28.90, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop", category: "mercearia", section: ["promocoes", "recomendados"], unit: "un" },
  { id: "19", name: "Sorvete Kibon 1.5L", price: 19.90, image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop", category: "congelados", section: ["recomendados"], unit: "un" },
  { id: "20", name: "Papel Higiênico 12un", price: 16.90, originalPrice: 21.90, image: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=300&h=300&fit=crop", category: "higiene", section: ["promocoes", "frequentes"], unit: "pct" },
];
