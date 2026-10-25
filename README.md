# HomeLast Startup

Supermercado digital para pequenos comércios locais. O dono do mercado ganha uma loja online pronta e um painel simples para controlar produtos, pedidos, estoque, cupons e frete. O cliente compra pelo celular.

Projeto desenvolvido na disciplina **Projeto Extensionista Integrador 4 (PEI 4)**, do curso de Engenharia de Software da UNIVAG.

**Site no ar:** https://mercado-r-pido-f-cil.vercel.app

## O problema

Muitos mercadinhos e mercearias vendem só no balcão. Não têm site nem cardápio digital, anotam pedidos à mão e, quando entram em aplicativos grandes, pagam comissão alta. O HomeLast leva o comércio de bairro para o celular do cliente, com custo acessível e sem comissão por venda.

## Funcionalidades

**Para o cliente**
- Loja com categorias, busca e rolagem rápida de produtos
- Ofertas, banners e anúncios
- Carrinho e finalização do pedido
- Cupons de desconto
- Acompanhamento e histórico de pedidos
- Avaliações dos produtos
- Perfil com foto
- Funciona como PWA (pode ser instalado no celular)

**Para o dono do mercado (painel administrativo)**
- Dashboard com faturamento, pedidos, ticket médio e lucro, além de gráficos
- Cadastro de produtos, categorias e estoque, com baixa automática
- Cupons de desconto (percentual, valor fixo, frete grátis e primeiro pedido)
- Banners e anúncios para os clientes
- Frete configurável (valor fixo e valor mínimo para frete grátis)
- Aviso sonoro e indicador de novos pedidos
- Visualização das avaliações dos clientes

**Em andamento**
- Agrupamento de variações do mesmo produto em um só card
- Notificações de novos pedidos

## Tecnologias

- React, TypeScript e Vite
- Tailwind CSS
- Supabase (banco de dados, login e regras de acesso)
- Vercel (hospedagem)
- Lovable (apoio na geração de código)

## Como rodar no seu computador

Precisa ter o [Node.js](https://nodejs.org) instalado.

```bash
# 1. Clonar o repositório
git clone https://github.com/GabriieelDev/homelast-startup.git
cd homelast-startup

# 2. Instalar as dependências
npm install

# 3. Rodar em modo de desenvolvimento
npm run dev
```

O site abre em `http://localhost:8080` ou `http://localhost:5173` (o endereço aparece no terminal)

### Variáveis de ambiente

O projeto usa um arquivo `.env` com as chaves **públicas** do Supabase:

```
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

Para usar outro banco, crie um projeto no Supabase, aplique os arquivos da pasta `supabase/migrations` e troque esses três valores.

## Estrutura do projeto

```
src/            código da loja e do painel (páginas, componentes, hooks)
supabase/       migrações do banco de dados e funções do servidor
public/         arquivos públicos (ícones e arquivos do PWA)
```

## Equipe

- Gabriel Carneiro
- Alex Alves de Anunciação
- Lucas Prates Miranda
- Mateus Pinho de Arruda
- Mikael Bruno Oliveira de Jesus
- Murilo De Freitas

## Próximos passos

- Concluir o agrupamento de variações de produtos
- Avisos de novos pedidos por notificação
- Encontrar o primeiro mercadinho parceiro e instalar a plataforma nele
- Documentar o processo de instalação para outros comércios
