import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import heroImage from "@/assets/hero-groceries.png";

interface HeroSectionProps {
  onStart: () => void;
}

const HeroSection = ({ onStart }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 text-center md:text-left space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              Entrega em 30–60 min
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Seu supermercado{" "}
              <span className="text-gradient">em minutos</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-md">
              Compre rápido, receba rápido. Sem filas, sem complicação.
            </p>
            <Button variant="hero" size="lg" className="text-lg px-8 py-6 rounded-full" onClick={onStart}>
              Começar agora
            </Button>
          </div>
          <div className="flex-1 max-w-md md:max-w-lg">
            <img
              src={heroImage}
              alt="Compras frescas do Mercado Flash"
              className="w-full h-auto rounded-2xl animate-slide-up"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
