import { Button } from "@/components/ui/button";

interface CTASectionProps {
  onStart: () => void;
}

const CTASection = ({ onStart }: CTASectionProps) => (
  <section className="py-16 bg-primary hl-hero-bg">
    <div className="container mx-auto px-4 text-center space-y-5">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground dark:text-foreground">
        Peça agora e receba em minutos
      </h2>
      <p className="text-primary-foreground/80 dark:text-muted-foreground max-w-md mx-auto">
        Milhares de produtos esperando por você. Comece suas compras agora!
      </p>
      <Button variant="accent" size="lg" className="rounded-full text-lg px-8 py-6" onClick={onStart}>
        Começar agora
      </Button>
    </div>
  </section>
);

export default CTASection;
