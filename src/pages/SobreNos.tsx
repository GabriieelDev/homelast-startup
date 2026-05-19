import { ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import SocialLinks from "@/components/SocialLinks";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const SobreNos = () => {
  const { settings } = useStoreSettings();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">{settings.name || "ServBem Supermercado"}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Sobre nós</h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>O ServBem Supermercado nasceu com a missão de tornar as compras do dia a dia mais simples, rápidas e seguras.</p>
          <p>Sabemos que o tempo é um dos recursos mais valiosos, e por isso criamos uma solução que elimina filas, deslocamentos e complicações.</p>
          <p>Aqui, você encontra tudo o que precisa com poucos cliques, recebendo seus produtos com agilidade e total confiança.</p>
          <p>Nosso compromisso vai além da entrega: buscamos oferecer qualidade, segurança em cada transação e um atendimento confiável.</p>
          <p>Mais do que um supermercado digital, somos uma plataforma construída sobre confiança, praticidade e respeito ao cliente.</p>
        </div>

        <div className="pt-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Siga-nos</h2>
          <SocialLinks variant="inline" />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SobreNos;
