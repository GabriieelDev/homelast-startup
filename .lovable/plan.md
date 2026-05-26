# Plano de Implementação

Duas funcionalidades grandes e interligadas. Sugiro implementar em **2 fases**, pois a Fase 1 (Categorias) é pré-requisito da Fase 2 (NF-e usa categorias dinâmicas).

---

## Fase 1 — Gerenciamento de Categorias

### Banco de dados (migração)
- Nova tabela `public.categories`:
  - `id uuid PK`, `name text`, `slug text unique`, `icon text`, `color text`, `display_order int`, `active bool default true`, timestamps
- Alterar `public.products`: adicionar coluna `category_id uuid` (mantendo `category text` legado para compatibilidade durante migração)
- Seed inicial: Hortifrúti, Mercearia, Bebidas, Limpeza, Higiene (mapeando produtos existentes pelo slug atual)
- RLS: leitura pública (apenas `active=true` para anon/clientes via policy), escrita restrita a admin (`has_role`)
- GRANTs corretos para anon/authenticated/service_role

### Frontend Admin
- Nova aba "Categorias" dentro de `src/pages/Admin.tsx` (ao lado de Produtos)
- Componente `CategoryManager.tsx`:
  - Lista em tabela com nome, ícone (emoji ou imagem), cor (swatch), nº de produtos, status, ações
  - Botão "Nova categoria" abre `CategoryFormDialog` com: nome, ícone (seletor emoji + upload opcional bucket `banners`), cor (color picker), slug auto-gerado/editável, ativo
  - Editar e remover (com confirmação + opção de mover produtos para outra categoria)
  - Reordenação drag-and-drop (usando `@dnd-kit` já presente ou alternativa leve)
- Atualizar `src/data/products.ts` / `CategoryFilters` para buscar categorias do banco via novo hook `useCategories()` com realtime
- Filtros da vitrine mostram apenas categorias ativas com ≥1 produto

### Constraint de memória
A regra atual em mem://ux/categories limita a 4 categorias fixas. Vou **atualizar essa memória** para refletir que categorias agora são dinâmicas (gerenciadas pelo admin), removendo a restrição.

---

## Fase 2 — Importação de Nota Fiscal (NF-e)

### Banco de dados
- Nova tabela `public.nfe_imports` (histórico):
  - `id`, `nfe_number text`, `nfe_key text`, `supplier text`, `nfe_date timestamptz`, `method text` ('xml'|'qrcode'), `imported_by uuid`, `products_count int`, `new_count int`, `updated_count int`, `raw_data jsonb`, `created_at`
- RLS: somente admin lê/insere

### Frontend — `Importar Nota Fiscal`
Nova aba no Admin com 3 sub-abas: **Upload XML | Escanear QR Code | Histórico**

**Upload XML:**
- Dropzone aceitando `.xml`
- Parser client-side usando `DOMParser` nativo, extraindo de `<det><prod>`: `xProd`, `cEAN`, `qCom`, `uCom`, `vUnCom`, `NCM`; do `<emit>`: nome do fornecedor; do `<ide>`: `nNF`, `dhEmi`, `chNFe`
- Tela de prévia: tabela editável com checkbox incluir/ignorar, seletor de categoria (vindo do CategoryManager), botão "Criar nova categoria" inline
- Confirmar → upsert em `products` por `cEAN` (atualiza `cost_price` + incrementa `product_stock`) ou cria novo; grava registro em `nfe_imports`
- Resumo final: novos / atualizados / ignorados

**Escanear QR Code:**
- Biblioteca: `html5-qrcode` (leve, funciona em mobile, câmera traseira por padrão)
- Guia de enquadramento + feedback ao detectar
- QR Code do DANFE contém URL com chave de acesso → extrair chave (44 dígitos)
- **Limitação real:** a SEFAZ NÃO oferece API pública gratuita para consulta de NF-e por chave. Cada estado tem webservice próprio com certificado digital A1/A3 obrigatório, e a "consulta pública" via site da SEFAZ retorna HTML (não JSON) e tem CAPTCHA.

  **Opções a decidir:**
  - (a) Integrar com serviço pago de terceiros (ex: Meu Danfe, NFe.io, Focus NFe, Arquivei) — requer API key, edge function como proxy
  - (b) Após escanear o QR, exibir a URL detectada e pedir ao admin que faça upload do XML correspondente (fluxo híbrido)
  - (c) Apenas registrar a chave e pedir importação manual dos itens

**Histórico:**
- Tabela listando importações com filtros, botão "ver detalhes" abrindo modal com produtos importados (a partir de `raw_data`)

### Edge function (se opção `a`)
- `nfe-lookup`: recebe chave NF-e, chama provedor escolhido, retorna JSON normalizado
- Secret: `NFE_PROVIDER_API_KEY`

---

## Perguntas antes de executar

1. **QR Code da SEFAZ:** qual opção prefere? (a) serviço pago de terceiros, (b) fluxo híbrido QR→upload XML, (c) apenas registrar chave
2. **Drag-and-drop de categorias:** posso adicionar `@dnd-kit/core` + `@dnd-kit/sortable` se ainda não estiverem instalados?
3. **Migração de produtos existentes:** mapear `products.category` (text) para os novos `category_id` automaticamente pelo nome/slug, OK?
4. **Implemento as duas fases nesta mesma rodada** ou prefere validar a Fase 1 antes de iniciar a Fase 2?

Aguardo suas respostas para iniciar a migração e o código.
