import { LogoIcon } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const PoliticaPrivacidade = () => (
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
          <LogoIcon className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg text-foreground">Mercado Flash</span>
        </div>
      </div>
    </header>

    <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Política de privacidade</h1>
      <ul className="space-y-4 text-muted-foreground leading-relaxed list-disc list-inside">
        <li>Coletamos informações essenciais como nome, endereço e dados de pagamento para processar pedidos.</li>
        <li>Seus dados são utilizados exclusivamente para melhorar sua experiência na plataforma.</li>
        <li>Garantimos a proteção das informações com medidas de segurança adequadas.</li>
        <li>Não compartilhamos dados pessoais com terceiros sem autorização.</li>
        <li>Utilizamos cookies para melhorar a navegação e personalizar a experiência.</li>
        <li>O usuário pode solicitar alterações ou exclusão de seus dados a qualquer momento.</li>
      </ul>
    </main>

    <Footer />
  </div>
);

export default PoliticaPrivacidade;
