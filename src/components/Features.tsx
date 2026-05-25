import { LogoIcon } from "@/components/Logo";
import { Rocket, Brain, Recycle } from "lucide-react";

const features = [
  { icon: Rocket, title: "Entrega rápida", desc: "Receba em 30–60 minutos", color: "text-primary" },
  { icon: Brain, title: "Sugestões do seu histórico", desc: "Baseadas nas suas compras", color: "text-accent" },
  { icon: Zap, title: "Compra sem complicação", desc: "Adicione com 1 clique", color: "text-primary" },
  { icon: Recycle, title: "Menos desperdício", desc: "Compre só o que precisa", color: "text-accent" },
];

const Features = () => (
  <section className="py-16 bg-secondary">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
        Por que escolher o <span className="text-gradient">Mercado Flash</span>?
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {features.map((f) => (
          <div key={f.title} className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-background shadow-sm">
              <f.icon className={`h-7 w-7 ${f.color}`} />
            </div>
            <h3 className="font-semibold text-foreground text-sm md:text-base">{f.title}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
