// Sends web push notifications for order events.
// Triggered by a Supabase Database Webhook on public.orders (INSERT and UPDATE).
//
// Secrets (Supabase → Edge Functions → Secrets), never in the repo:
//   WEBHOOK_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

type Order = {
  id: string;
  user_id: string;
  order_number: number;
  status: string;
  total: number | string;
  customer_name: string | null;
  items?: unknown;
  cancel_reason?: string | null;
  cancelled_by?: string | null;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Order | null;
  old_record: Order | null;
};

type PushMessage = { title: string; body: string; url: string; tag?: string; renotify?: boolean };

const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
};

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

webpush.setVapidDetails(env("VAPID_SUBJECT"), env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  recebido: { title: "Pedido recebido ✅", body: "Já estamos cuidando do seu pedido." },
  preparo: { title: "Estamos preparando seu pedido 👨‍🍳", body: "Falta pouco!" },
  caminho: { title: "Seu pedido saiu para entrega 🛵", body: "O entregador está a caminho." },
  entregue: { title: "Pedido entregue 🎉", body: "Bom apetite! Conta pra gente o que achou." },
  cancelado: { title: "Pedido cancelado", body: "Se precisar, é só fazer um novo pedido." },
};

const FALLBACK_STATUS = { title: "Pedido atualizado", body: "Toque para ver os detalhes." };

const brl = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const LOWERCASE_WORDS = new Set(["da", "de", "do", "das", "dos", "e"]);

/** "gabriela rosa" → "Gabriela Rosa"; keeps connectors like "da" lowercase. */
const formatName = (name: string | null) => {
  const words = (name ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Cliente";
  return words
    .map((w, i) => (i > 0 && LOWERCASE_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
};

/** Sum of item quantities from orders.items (jsonb); null when it can't be read. */
const itemCount = (items: unknown): number | null => {
  if (!Array.isArray(items) || items.length === 0) return null;
  let total = 0;
  for (const item of items) {
    const qty = Number((item as { quantity?: unknown })?.quantity ?? 1);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    total += qty;
  }
  return total;
};

const itemsLabel = (items: unknown) => {
  const n = itemCount(items);
  if (n === null) return null;
  return n === 1 ? "1 item" : `${n} itens`;
};

const adminIds = async (): Promise<string[]> => {
  const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.user_id as string))];
};

/** Sends to every device of the given users; removes subscriptions that are gone (404/410). */
const sendToUsers = async (userIds: string[], message: PushMessage) => {
  if (userIds.length === 0) return 0;
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (error) throw error;

  const payload = JSON.stringify(message);
  const results = await Promise.allSettled(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 24 },
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          console.error("push failed", status, (err as Error).message);
        }
        throw err;
      }
    }),
  );
  return results.filter((r) => r.status === "fulfilled").length;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { type, record, old_record } = payload;
  if (payload.table !== "orders" || !record) return json({ skipped: true });

  try {
    let sent = 0;

    if (type === "INSERT") {
      const parts = [formatName(record.customer_name), itemsLabel(record.items), brl(record.total)];
      sent += await sendToUsers(await adminIds(), {
        title: "Novo pedido recebido 🛒",
        body: parts.filter(Boolean).join(" · "),
        url: "/admin",
        tag: `order-${record.id}-admin`,
        renotify: false,
      });
    } else if (type === "UPDATE" && old_record && old_record.status !== record.status) {
      const msg = STATUS_MESSAGES[record.status] ?? FALLBACK_STATUS;
      const reason = record.status === "cancelado" && record.cancel_reason?.trim()
        ? `Motivo: ${record.cancel_reason.trim()}`
        : "";
      const cancelledByClient = record.status === "cancelado" && record.cancelled_by === "cliente";
      const cancelledByAdmin = record.status === "cancelado" && record.cancelled_by === "admin";

      // Quem cancelou não recebe push do próprio cancelamento.
      if (record.status !== "cancelado" || cancelledByAdmin) {
        sent += await sendToUsers([record.user_id], {
          title: msg.title,
          body: cancelledByAdmin
            ? ["A loja cancelou seu pedido", reason].filter(Boolean).join(" · ")
            : msg.body,
          url: `/rastreamento?pedido=${encodeURIComponent(record.id)}`,
          tag: `order-${record.id}`,
          renotify: true,
        });
      }

      if (cancelledByClient) {
        sent += await sendToUsers(await adminIds(), {
          title: "Pedido cancelado ❌",
          body: `${formatName(record.customer_name)} cancelou o pedido · ${brl(record.total)}${reason ? ` · ${reason}` : ""}`,
          url: "/admin",
          tag: `order-${record.id}-admin`,
          renotify: true,
        });
      }
    }

    return json({ ok: true, sent });
  } catch (err) {
    console.error(err);
    return json({ error: "Internal error" }, 500);
  }
});
