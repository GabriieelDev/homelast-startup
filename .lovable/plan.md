## Sistema de Promoções — HomeLast

### 1. Banco de Dados (migration)

Adicionar à tabela `products`:
- `on_sale` boolean default false
- `discount_type` text ('percentage' | 'fixed')
- `discount_value` numeric default 0
- `sale_price` numeric (calculado pelo trigger)
- `sale_start` timestamptz
- `sale_end` timestamptz (nullable)
- `sale_label` text (nullable)

**Trigger BEFORE INSERT/UPDATE em products** (`compute_sale_price`):
- Calcula `sale_price` a partir de `price`, `discount_type`, `discount_value`
- Garante `sale_price >= 0`
- Valida `sale_end > sale_start` quando ambos definidos

**Função `is_sale_active(p products)`** (helper): `on_sale AND sale_start <= now() AND (sale_end IS NULL OR sale_end >= now())`.

**Expiração automática:** view/cálculo em runtime (frontend) + cron job `pg_cron` rodando a cada 5 min que faz `UPDATE products SET on_sale = false WHERE on_sale = true AND sale_end IS NOT NULL AND sale_end < now()`. Insere alerta na nova tabela `sale_expirations_log` (id, product_id, expired_at) para o admin visualizar.

### 2. Admin — Edição de Produto

Atualizar `src/components/admin/ProductFormDialog.tsx`:
- Nova seção "Promoção" com:
  - Switch "Produto em promoção"
  - Select tipo (% / R$ fixo)
  - Input valor do desconto
  - Preço promocional calculado em tempo real (verde)
  - DatePicker início + DatePicker fim (opcional)
  - Input label personalizado
  - Botão "Remover promoção"
- Validações: desconto não pode exceder preço; data fim > data início; aviso se sale_price < cost_price (margem negativa).

### 3. Vitrine (Cliente)

**`src/data/products.ts` / `useProducts.ts`:** mapear novos campos no `Product` type + helper `isSaleActive(product)` e `getEffectivePrice(product)`.

**`src/components/ProductCard.tsx`:**
- Badge vermelho topo: label personalizado ou `-X% OFF`
- Preço original riscado + preço promocional em verde-esmeralda
- Borda sutil verde (`border-accent/40`)
- Componente `<SaleCountdown end={sale_end} />` com timer hh:mm:ss (atualiza a cada 1s)

**`src/components/CategoryFilters.tsx`:** adicionar filtro virtual "Promoções 🔥" (id `sale`). Página vitrine filtra por `isSaleActive`.

**Página de produto** (se existir; caso contrário no card expandido): preço original + promocional, badge destaque, countdown, "Economize R$ X".

### 4. Relatórios

`src/lib/reports.ts` + UI no Admin:
- Lista de produtos atualmente em promoção
- Histórico (`sale_expirations_log`)
- Comparativo: somar `orders.items` cujos produtos estavam em promoção vs. preço normal (usando snapshot do preço no momento da venda — ler o `price` registrado em `items` jsonb).

### 5. Detalhes técnicos

- Countdown: hook `useCountdown(endDate)` retornando `{ hours, minutes, seconds, expired }`.
- Quando expirado no client, ocultar badge mesmo antes do cron rodar.
- Preço usado em todo lugar (cart, checkout, productCard) passa por `getEffectivePrice(p)` para garantir consistência.
- Cart já guarda preço unitário no snapshot — preços promocionais aplicados no momento do add.

### Arquivos novos
- `src/lib/promotions.ts` (helpers `isSaleActive`, `getEffectivePrice`, `getDiscountPct`)
- `src/components/SaleCountdown.tsx`
- `src/hooks/useCountdown.ts`
- `src/components/admin/SaleExpirationsLog.tsx`

### Arquivos editados
- `src/data/products.ts` (tipo Product)
- `src/hooks/useProducts.ts` (mapear campos)
- `src/components/admin/ProductFormDialog.tsx` (seção promoção)
- `src/components/ProductCard.tsx` (badge + preços + countdown + borda)
- `src/components/CategoryFilters.tsx` (filtro Promoções)
- `src/pages/Index.tsx` (aplicar filtro sale)
- `src/hooks/useCart.ts` (usar preço efetivo)
- `src/lib/reports.ts` (impacto promoções)
- `src/pages/Admin.tsx` (sub-aba histórico de promoções nos relatórios)

### Migração SQL fornecida ao final para o Supabase externo do usuário.
