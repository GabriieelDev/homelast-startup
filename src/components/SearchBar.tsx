import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { products } from "@/data/products";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    if (value.length < 2) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 5);
  }, [value]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div
        className={`flex items-center gap-2 rounded-full border-2 bg-background px-4 py-3 transition-all ${
          focused ? "border-primary shadow-lg shadow-primary/10" : "border-border"
        }`}
      >
        <Search className="h-5 w-5 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-body"
        />
        {value && (
          <button onClick={() => onChange("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {focused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
          {suggestions.map((product) => (
            <button
              key={product.id}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left"
              onMouseDown={() => onChange(product.name)}
            >
              <img src={product.image} alt={product.name} className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-sm font-medium text-foreground">{product.name}</span>
              <span className="text-sm text-primary ml-auto font-semibold">
                R$ {product.price.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
