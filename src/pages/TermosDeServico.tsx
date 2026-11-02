import { LogoIcon } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Sobre o serviço",
    body: (
      <p>
        O HomeLast é uma plataforma de compras online de supermercado, operada por HomeLast. Por aqui você escolhe
        os produtos, faz o pedido e recebe em casa ou retira, conforme as opções disponíveis.
      </p>
    ),
  },
  {
    title: "2. Cadastro e conta",
    body: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Você deve informar dados verdadeiros e mantê-los atualizados.</li>
        <li>
          Você é responsável pela sua senha e por tudo o que for feito com a sua conta. Não compartilhe a senha com
          outras pessoas.
        </li>
        <li>Se perceber uso indevido da sua conta, avise-nos pelo contato abaixo.</li>
      </ul>
    ),
  },
  {
    title: "3. Pedidos e preços",
    body: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Preços e estoque podem mudar a qualquer momento, sem aviso prévio.</li>
        <li>
          Seu pedido só é confirmado depois que a loja o aceita. Se algum item estiver em falta, entraremos em
          contato.
        </li>
      </ul>
    ),
  },
  {
    title: "4. Pagamento",
    body: (
      <p>
        Aceitamos as formas de pagamento informadas no checkout, pagas na entrega ou na retirada. As opções
        disponíveis podem variar e sempre aparecem antes de você finalizar o pedido.
      </p>
    ),
  },
  {
    title: "5. Entrega",
    body: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Os prazos de entrega são estimativas e podem variar.</li>
        <li>A taxa de frete é mostrada antes de você finalizar o pedido.</li>
        <li>O endereço é o que você informar. Confira os dados, pois não nos responsabilizamos por endereços errados.</li>
      </ul>
    ),
  },
  {
    title: "6. Cancelamentos, trocas e devoluções",
    body: (
      <p>
        Cancelamentos, trocas e devoluções seguem o Código de Defesa do Consumidor (Lei nº 8.078/1990). Se houver
        algum problema com o seu pedido, fale com a gente pelo contato abaixo.
      </p>
    ),
  },
  {
    title: "7. Cupons e promoções",
    body: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Cupons e promoções têm prazo de validade.</li>
        <li>Quando indicado, o cupom pode ser usado apenas uma vez por cliente.</li>
        <li>Salvo indicação em contrário, cupons e promoções não são acumuláveis.</li>
      </ul>
    ),
  },
  {
    title: "8. Uso adequado",
    body: (
      <p>
        É proibido usar a plataforma para fraudes, para uso indevido ou para tentar invadir ou prejudicar o sistema.
        Contas que descumprirem isso podem ser suspensas ou encerradas.
      </p>
    ),
  },
  {
    title: "9. Alterações nos termos",
    body: (
      <p>
        Podemos atualizar estes termos quando necessário. A data da última atualização fica no topo desta página, e
        continuar usando a plataforma significa concordar com a versão em vigor.
      </p>
    ),
  },
  {
    title: "10. Contato",
    body: <p>Dúvidas? Fale com HomeLast pelo e-mail gabrielfreefire4650@gmail.com.</p>,
  },
];

const TermosDeServico = () => (
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
          <span className="font-display font-bold text-lg text-foreground">HomeLast</span>
        </div>
      </div>
    </header>

    <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Termos de Serviço</h1>
        <p className="text-sm text-muted-foreground">Última atualização: 2 de novembro de 2026</p>
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

export default TermosDeServico;
