import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-background py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl">Mercado Flash</span>
          </div>
          <p className="text-sm opacity-60">
            Seu supermercado digital. Rápido, prático e inteligente.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-semibold">Links</h4>
          <ul className="space-y-2 text-sm opacity-60">
            <li><a href="#" className="hover:opacity-100 transition-opacity">Sobre nós</a></li>
            <li><a href="#" className="hover:opacity-100 transition-opacity">Termos de uso</a></li>
            <li><a href="#" className="hover:opacity-100 transition-opacity">Política de privacidade</a></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-semibold">Contato</h4>
          <ul className="space-y-2 text-sm opacity-60">
            <li>contato@mercadoflash.com.br</li>
            <li>(11) 99999-9999</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10 mt-8 pt-6 text-center text-sm opacity-40">
        © 2026 Mercado Flash. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
