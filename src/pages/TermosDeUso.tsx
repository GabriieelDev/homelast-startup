import { Zap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const TermosDeUso = () => (
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
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Mercado Flash</span>
        </div>
      </div>
    </header>

    <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Termos de uso</h1>
      <ul className="space-y-4 text-muted-foreground leading-relaxed list-disc list-inside">
        <li>Ao utilizar a plataforma, o usuário concorda com todas as condições estabelecidas.</li>
        <li>O usuário deve fornecer informações verdadeiras e atualizadas.</li>
        <li>Os produtos estão sujeitos à disponibilidade em estoque.</li>
        <li>Os prazos de entrega são estimados e podem sofrer variações.</li>
        <li>A plataforma pode realizar alterações, melhorias ou atualizações sem aviso prévio.</li>
        <li>O uso indevido da conta é de responsabilidade do usuário.</li>
        <li>Pagamentos devem ser realizados através dos métodos disponibilizados na plataforma.</li>
      </ul>
    </main>

    <Footer />
  </div>
);

export default TermosDeUso;
