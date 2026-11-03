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
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Order | null;
  old_record: Order | null;
};

type PushMessage = { title: string; body: string; url: string; tag?: string };

const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
};

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

webpush.setVapidDetails(env("VAPID_SUBJECT"), env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));

const STATUS_MESSAGES: Record<string, string> = {
  recebido: "Recebemos seu pedido e já vamos começar a prepará-lo.",
  preparo: "Seu pedido está em preparo. 👨‍🍳",
  caminho: "Seu pedido saiu para entrega! 🛵",
  entregue: "Seu pedido foi entregue. Bom apetite! 😋",
  cancelado: "Seu pedido foi cancelado. Em caso de dúvida, fale com a loja.",
};

const brl = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
      const customer = record.customer_name?.trim() || "Cliente";
      sent += await sendToUsers(await adminIds(), {
        title: `Novo pedido #${record.order_number}`,
        body: `${customer} · ${brl(record.total)}`,
        url: "/admin",
        tag: `order-${record.id}-admin`,
      });
    } else if (type === "UPDATE" && old_record && old_record.status !== record.status) {
      sent += await sendToUsers([record.user_id], {
        title: `Pedido #${record.order_number}`,
        body: STATUS_MESSAGES[record.status] ?? `Status atualizado: ${record.status}`,
        url: "/pedidos",
        tag: `order-${record.id}`,
      });

      if (record.status === "cancelado") {
        const customer = record.customer_name?.trim() || "Cliente";
        sent += await sendToUsers(await adminIds(), {
          title: `Pedido #${record.order_number} cancelado`,
          body: `${customer} · ${brl(record.total)}`,
          url: "/admin",
          tag: `order-${record.id}-admin`,
        });
      }
    }

    return json({ ok: true, sent });
  } catch (err) {
    console.error(err);
    return json({ error: "Internal error" }, 500);
  }
});
