import { LogoIcon } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Quais dados coletamos",
    body: (
      <>
        <p>Para que você possa comprar no [NOME DA LOJA], coletamos os seguintes dados:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nome completo, e-mail e telefone, informados no cadastro;</li>
          <li>Endereço de entrega;</li>
          <li>Histórico de pedidos;</li>
          <li>Dados básicos do seu perfil (nome e e-mail) quando você entra com a conta Google.</li>
        </ul>
      </>
    ),
  },
  {
    title: "2. Para que usamos seus dados",
    body: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Processar e acompanhar seus pedidos;</li>
        <li>Realizar a entrega no endereço informado;</li>
        <li>Entrar em contato com você sobre pedidos, entregas e suporte.</li>
      </ul>
    ),
  },
  {
    title: "3. Com quem compartilhamos",
    body: (
      <>
        <p>Compartilhamos apenas o necessário para o funcionamento do serviço:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Entregador, que recebe nome, telefone e endereço para realizar a entrega;</li>
          <li>Serviços de hospedagem e de banco de dados que mantêm o site no ar e armazenam as informações com segurança.</li>
        </ul>
        <p>Não vendemos seus dados pessoais.</p>
      </>
    ),
  },
  {
    title: "4. Por quanto tempo guardamos",
    body: (
      <p>
        Mantemos seus dados enquanto sua conta estiver ativa e pelo tempo necessário para cumprir obrigações legais
        e fiscais. Quando você pedir a exclusão da conta, apagamos ou anonimizamos os dados, salvo os que a lei nos
        obrigue a manter.
      </p>
    ),
  },
  {
    title: "5. Seus direitos (LGPD)",
    body: (
      <>
        <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode a qualquer momento:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Acessar os dados que temos sobre você;</li>
          <li>Corrigir dados incompletos ou desatualizados;</li>
          <li>Solicitar a exclusão dos seus dados.</li>
        </ul>
      </>
    ),
  },
  {
    title: "6. Contato do responsável",
    body: (
      <p>
        Para exercer seus direitos ou tirar dúvidas, fale com [NOME DA LOJA] pelo e-mail{" "}
        [E-MAIL DE CONTATO DA LOJA].
      </p>
    ),
  },
];

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

    <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Política de privacidade</h1>
        <p className="text-sm text-muted-foreground">
          Explicamos de forma simples como o [NOME DA LOJA] cuida dos seus dados pessoais.
        </p>
      </div>
      {sections.map((s) => (
        <section key={s.title} className="space-y-2 text-muted-foreground leading-relaxed">
          <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
          {s.body}
        </section>
      ))}
    </main>

    <Footer />
  </div>
);

export default PoliticaPrivacidade;
