import { Link } from "react-router-dom";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import SocialLinks from "@/components/SocialLinks";
import Logo from "@/components/Logo";

const Footer = () => {
  const { settings } = useStoreSettings();
  return (
    <footer className="bg-foreground text-background dark:bg-[#121B31] dark:text-foreground dark:border-t dark:border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="bg-white inline-block rounded-lg p-3">
              <Logo className="h-16 w-auto" />
            </div>
            <p className="text-sm opacity-60">
              Seu supermercado digital. Rápido, prático e confiável.
            </p>
            <div className="pt-2">
              <SocialLinks variant="footer" size="md" />
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">Links</h4>
            <ul className="space-y-2 text-sm opacity-60">
              <li><Link to="/sobre" className="hover:opacity-100 transition-opacity">Sobre nós</Link></li>
              <li><Link to="/termos" className="hover:opacity-100 transition-opacity">Termos de uso</Link></li>
              <li><Link to="/privacidade" className="hover:opacity-100 transition-opacity">Política de privacidade</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">Contato</h4>
            <ul className="space-y-2 text-sm opacity-60">
              {settings.phone && <li>{settings.phone}</li>}
              {settings.address && <li>{settings.address}</li>}
              {settings.hours && <li>{settings.hours}</li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 mt-8 pt-6 text-center text-sm opacity-40">
          © {new Date().getFullYear()} {settings.name || "HomeLast Startup"}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
