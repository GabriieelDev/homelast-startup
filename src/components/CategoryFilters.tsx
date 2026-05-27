import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryFiltersProps {
  active: string;
  onChange: (id: string) => void;
}

const CategoryFilters = ({ active, onChange }: CategoryFiltersProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { categories } = useCategories({ onlyActive: true });

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  const items = [
    { id: "all", name: "Todos", icon: "🛒" },
    { id: "sale", name: "Promoções", icon: "🔥" },
    ...categories.map((c) => ({ id: c.slug, name: c.name, icon: c.icon })),
  ];

  return (
    <div className="relative group">
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((cat) => (
          <Button
            key={cat.id}
            variant={active === cat.id ? "pill-active" : "pill"}
            size="sm"
            onClick={() => onChange(cat.id)}
            className="shrink-0 gap-1.5"
          >
            <span>{cat.icon}</span>
            {cat.name}
          </Button>
        ))}
      </div>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
      >
        <ChevronRight className="h-4 w-4 text-foreground" />
      </button>
    </div>
  );
};

export default CategoryFilters;
