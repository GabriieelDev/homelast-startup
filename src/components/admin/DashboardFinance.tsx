import { useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from "recharts";
import {
  DollarSign, ShoppingBag, TrendingUp, Package, Tag, Truck, XCircle, Wallet, PiggyBank, Percent,
  AlertTriangle, CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/products";

const TZ = "America/Cuiaba";
const DAY_MS = 86400000;

type Preset = "today" | "7d" | "30d" | "month" | "lastMonth" | "custom";
const PRESET_LABEL: Record<Preset, string> = {
  today: "Hoje", "7d": "7 dias", "30d": "30 dias", month: "Este mês", lastMonth: "Mês passado", custom: "Personalizado",
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

// ---- Fuso America/Cuiaba ----
const ymdFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
});

/** "YYYY-MM-DD" da data no fuso de Cuiabá. */
const ymdOf = (d: Date) => ymdFmt.format(d);

/** Offset (ms) de Cuiabá em relação ao UTC para um instante. */
const tzOffset = (d: Date) => {
  const p: Record<string, number> = {};
  partsFmt.formatToParts(d).forEach((x) => { if (x.type !== "literal") p[x.type] = Number(x.value); });
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(d.getTime() / 1000) * 1000;
};

/** Instante UTC do início (00:00) de um dia civil de Cuiabá. */
const startOfDayTz = (y: number, m: number, d: number) => {
  const guess = new Date(Date.UTC(y, m - 1, d));
  return new Date(guess.getTime() - tzOffset(guess));
};
const startOfYmd = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return startOfDayTz(y, m, d);
};
/** Dia seguinte (YYYY-MM-DD) de um dia civil. */
const addDaysYmd = (ymd: string, n: number) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
/** Date local do calendário (meio-dia) -> "YYYY-MM-DD" civil escolhido pelo usuário. */
const localToYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Retorna [início, fim) do período. */
const resolveRange = (preset: Preset, custom?: DateRange): { start: Date; end: Date } => {
  const today = ymdOf(new Date());
  const [ty, tm] = today.split("-").map(Number);
  const tomorrow = startOfYmd(addDaysYmd(today, 1));
  switch (preset) {
    case "today": return { start: startOfYmd(today), end: tomorrow };
    case "7d": return { start: startOfYmd(addDaysYmd(today, -6)), end: tomorrow };
    case "30d": return { start: startOfYmd(addDaysYmd(today, -29)), end: tomorrow };
    case "month": return { start: startOfDayTz(ty, tm, 1), end: tomorrow };
    case "lastMonth": {
      const py = tm === 1 ? ty - 1 : ty;
      const pm = tm === 1 ? 12 : tm - 1;
      return { start: startOfDayTz(py, pm, 1), end: startOfDayTz(ty, tm, 1) };
    }
    case "custom": {
      if (custom?.from) {
        const from = localToYmd(custom.from);
        const to = localToYmd(custom.to ?? custom.from);
        return { start: startOfYmd(from), end: startOfYmd(addDaysYmd(to, 1)) };
      }
      return { start: startOfYmd(addDaysYmd(today, -29)), end: tomorrow };
    }
  }
};

// ---- Métricas ----
type Totals = {
  revenue: number; count: number; ticket: number; items: number; discounts: number;
  shipping: number; cancelled: number; cogs: number; profit: number; margin: number | null;
};

const compute = (orders: any[], costs: Record<string, number>): Totals => {
  let revenue = 0, count = 0, items = 0, discounts = 0, shipping = 0, cancelled = 0, cogs = 0;
  orders.forEach((o) => {
    if (o.status === "cancelado") { cancelled++; return; }
    count++;
    revenue += Number(o.total) || 0;
    discounts += Number(o.discount) || 0;
    shipping += Number(o.shipping) || 0;
    (Array.isArray(o.items) ? o.items : []).forEach((it: any) => {
      const q = Number(it.quantity) || 0;
      items += q;
      cogs += (costs[it.id] ?? 0) * q;
    });
  });
  // Lucro bruto sobre mercadorias: (total - frete) - CMV
  const profit = revenue - shipping - cogs;
  const merch = revenue - shipping;
  return {
    revenue, count, ticket: count ? revenue / count : 0, items, discounts, shipping, cancelled, cogs, profit,
    margin: merch > 0 ? (profit / merch) * 100 : null,
  };
};

const Variation = ({ cur, prev, invert }: { cur: number; prev: number; invert?: boolean }) => {
  if (prev === 0) {
    return <p className="text-xs text-muted-foreground">{cur > 0 ? "novo" : "—"} vs anterior</p>;
  }
  const v = ((cur - prev) / Math.abs(prev)) * 100;
  if (!Number.isFinite(v)) return <p className="text-xs text-muted-foreground">—</p>;
  const good = invert ? v <= 0 : v >= 0;
  return (
    <p className={`text-xs font-semibold ${good ? "text-primary" : "text-destructive"}`}>
      {v >= 0 ? "▲" : "▼"} {pct(Math.abs(v))} vs anterior
    </p>
  );
};

const Card = ({ icon: Icon, color, label, value, children }: {
  icon: typeof DollarSign; color: string; label: string; value: string; children?: React.ReactNode;
}) => (
  <div className="p-4 rounded-lg bg-secondary border-l-4 min-w-0" style={{ borderLeftColor: color }}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <p className="text-xs text-muted-foreground truncate">{label}</p>
    </div>
    <p className="text-xl md:text-2xl font-bold text-foreground truncate">{value}</p>
    {children}
  </div>
);

const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix", credit: "Crédito", debit: "Débito", card: "Cartão", cartao: "Cartão", cash: "Dinheiro",
  dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito",
};

interface Props {
  orders: any[];
  products: Product[];
  /** Conteúdo extra (ex.: tempo médio de entrega, alertas de estoque) renderizado ao final. */
  footer?: React.ReactNode;
}

const DashboardFinance = ({ orders, products, footer }: Props) => {
  const [preset, setPreset] = useState<Preset>("30d");
  const [range, setRange] = useState<DateRange | undefined>();
  const [calOpen, setCalOpen] = useState(false);

  const costs = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p) => { m[p.id] = p.costPrice ?? 0; });
    return m;
  }, [products]);

  const data = useMemo(() => {
    const { start, end } = resolveRange(preset, range);
    const span = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - span);
    const inRange = (o: any, a: Date, b: Date) => { const t = new Date(o.created_at).getTime(); return t >= a.getTime() && t < b.getTime(); };
    const cur = orders.filter((o) => inRange(o, start, end));
    const prev = orders.filter((o) => inRange(o, prevStart, start));
    const valid = cur.filter((o) => o.status !== "cancelado");

    // Faturamento por dia (dias civis de Cuiabá)
    const startYmd = ymdOf(new Date(start.getTime() + 1));
    const days = Math.max(1, Math.round(span / DAY_MS));
    const daily: { key: string; label: string; value: number }[] = [];
    for (let i = 0; i < days; i++) {
      const key = addDaysYmd(startYmd, i);
      const [, m, d] = key.split("-");
      daily.push({ key, label: `${d}/${m}`, value: 0 });
    }
    const dayIdx = new Map(daily.map((d, i) => [d.key, i]));
    valid.forEach((o) => {
      const i = dayIdx.get(ymdOf(new Date(o.created_at)));
      if (i !== undefined) daily[i].value += Number(o.total) || 0;
    });

    // Top produtos e formas de pagamento
    const byProduct: Record<string, { name: string; qty: number; revenue: number }> = {};
    const usedIds = new Set<string>();
    const pay: Record<string, number> = {};
    valid.forEach((o) => {
      pay[o.payment_method ?? "—"] = (pay[o.payment_method ?? "—"] ?? 0) + 1;
      (Array.isArray(o.items) ? o.items : []).forEach((it: any) => {
        const q = Number(it.quantity) || 0;
        usedIds.add(it.id);
        const e = (byProduct[it.id] ??= { name: it.name ?? it.id, qty: 0, revenue: 0 });
        e.qty += q;
        e.revenue += (Number(it.price) || 0) * q;
      });
    });
    const list = Object.values(byProduct);
    const noCost = Array.from(usedIds).filter((id) => !(costs[id] > 0)).length;

    return {
      totals: compute(cur, costs),
      prevTotals: compute(prev, costs),
      daily,
      topRevenue: [...list].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      topQty: [...list].sort((a, b) => b.qty - a.qty).slice(0, 5),
      payments: Object.entries(pay).sort((a, b) => b[1] - a[1]),
      noCost,
      label: `${new Intl.DateTimeFormat("pt-BR", { timeZone: TZ }).format(start)} – ${new Intl.DateTimeFormat("pt-BR", { timeZone: TZ }).format(new Date(end.getTime() - 1))}`,
      validCount: valid.length,
    };
  }, [orders, costs, preset, range]);

  const { totals: t, prevTotals: p } = data;
  const tick = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

  const choose = (k: Preset) => {
    setPreset(k);
    if (k === "custom") setCalOpen(true);
  };

  const profitReliable = data.noCost === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-xs text-muted-foreground">{data.label} · fuso de Cuiabá · exclui cancelados</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PRESET_LABEL) as Preset[]).filter((k) => k !== "custom").map((k) => (
            <button
              key={k}
              onClick={() => choose(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                preset === k ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-secondary"
              }`}
            >{PRESET_LABEL[k]}</button>
          ))}
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => setPreset("custom")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 ${
                  preset === "custom" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-secondary"
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" /> Personalizado
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="range"
                locale={ptBR}
                selected={range}
                onSelect={setRange}
                numberOfMonths={1}
                disabled={{ after: new Date() }}
                initialFocus
              />
              <div className="flex items-center justify-between gap-2 p-3 pt-0">
                <p className="text-xs text-muted-foreground">
                  {range?.from ? "Clique na data final (ou aplique para 1 dia)" : "Escolha a data inicial"}
                </p>
                <Button size="sm" disabled={!range?.from} onClick={() => setCalOpen(false)}>Aplicar</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card icon={DollarSign} color="#00B894" label="Faturamento bruto" value={brl(t.revenue)}>
          <Variation cur={t.revenue} prev={p.revenue} />
        </Card>
        <Card icon={ShoppingBag} color="#1D2D50" label="Pedidos" value={String(t.count)}>
          <Variation cur={t.count} prev={p.count} />
        </Card>
        <Card icon={TrendingUp} color="#6C63FF" label="Ticket médio" value={brl(t.ticket)}>
          <Variation cur={t.ticket} prev={p.ticket} />
        </Card>
        <Card icon={Package} color="#3498DB" label="Itens vendidos" value={String(t.items)}>
          <Variation cur={t.items} prev={p.items} />
        </Card>
        <Card icon={Tag} color="#F39C12" label="Descontos (cupons)" value={brl(t.discounts)}>
          <Variation cur={t.discounts} prev={p.discounts} invert />
        </Card>
        <Card icon={Truck} color="#1D2D50" label="Frete cobrado" value={brl(t.shipping)}>
          <Variation cur={t.shipping} prev={p.shipping} />
        </Card>
        <Card icon={XCircle} color="#E74C3C" label="Pedidos cancelados" value={String(t.cancelled)}>
          <Variation cur={t.cancelled} prev={p.cancelled} invert />
        </Card>
        <Card icon={Wallet} color="#E67E22" label="Custo dos produtos (CMV)" value={brl(t.cogs)}>
          <Variation cur={t.cogs} prev={p.cogs} invert />
        </Card>
        <Card icon={PiggyBank} color="#00B894" label="Lucro bruto" value={brl(t.profit)}>
          <Variation cur={t.profit} prev={p.profit} />
        </Card>
        <Card icon={Percent} color="#00B894" label="Margem" value={profitReliable && t.margin !== null ? pct(t.margin) : "—"}>
          {profitReliable && t.margin !== null && p.margin !== null ? (
            <Variation cur={t.margin} prev={p.margin} />
          ) : (
            <p className="text-xs text-muted-foreground">{profitReliable ? "sem vendas" : "indisponível"}</p>
          )}
        </Card>
      </div>

      {data.noCost > 0 && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground bg-orange-500/10 border border-orange-500/30 rounded-md px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-px" />
          {data.noCost} {data.noCost === 1 ? "produto sem custo" : "produtos sem custo"}: o lucro pode estar superestimado (margem oculta).
        </p>
      )}
      <p className="text-[11px] text-muted-foreground -mt-3">
        Faturamento = total dos pedidos não cancelados (inclui frete, já com desconto). Lucro bruto = faturamento − frete − CMV.
      </p>

      <div className="p-4 rounded-lg border border-border">
        <h3 className="font-semibold text-foreground mb-3">Faturamento por dia</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={tick} minTickGap={16} />
              <YAxis tick={tick} tickFormatter={(v) => `R$ ${v}`} width={64} />
              <RTooltip formatter={(v: number) => [brl(Number(v)), "Faturamento"]} labelStyle={{ color: "#1D2D50" }} />
              <Bar dataKey="value" fill="#00B894" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-3">Top 5 por receita</h3>
          {data.topRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
          ) : (
            <ul className="space-y-2">
              {data.topRevenue.map((x, i) => (
                <li key={x.name + i} className="flex justify-between gap-3 text-sm">
                  <span className="text-foreground truncate">{i + 1}. {x.name}</span>
                  <span className="font-bold text-primary shrink-0">{brl(x.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-3">Top 5 por quantidade</h3>
          {data.topQty.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
          ) : (
            <ul className="space-y-2">
              {data.topQty.map((x, i) => (
                <li key={x.name + i} className="flex justify-between gap-3 text-sm">
                  <span className="text-foreground truncate">{i + 1}. {x.name}</span>
                  <span className="font-bold text-primary shrink-0">{x.qty} un</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border">
        <h3 className="font-semibold text-foreground mb-3">Pedidos por forma de pagamento</h3>
        {data.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem pedidos no período.</p>
        ) : (
          <ul className="space-y-2.5">
            {data.payments.map(([k, n]) => (
              <li key={k} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-foreground">{PAYMENT_LABEL[k] ?? k}</span>
                  <span className="text-muted-foreground">{n} · {pct((n / data.validCount) * 100)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(n / data.validCount) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {footer}
    </div>
  );
};

export default DashboardFinance;
