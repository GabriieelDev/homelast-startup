import { useSyncExternalStore, useCallback } from "react";
import { Product } from "@/data/products";
import { getEffectivePrice } from "@/lib/promotions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  product: Product;
  quantity: number;
}

const STORAGE_KEY = "servbem.cart.v2";

function loadFromLS(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: CartItem[] = JSON.parse(raw);
    return parsed.filter((i) => i?.product?.id);
  } catch {
    return [];
  }
}

function saveToLS(items: CartItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

// ------- Singleton store (shared across hook instances) -------
let _items: CartItem[] = loadFromLS();
const listeners = new Set<() => void>();
let _userId: string | null = null;
let _serverSyncEnabled = false;
let _suppressNextPush = false;

function notify() { listeners.forEach((l) => l()); }

// Defer heavy persistence (JSON.stringify + localStorage + Supabase upsert)
// out of the click handler to keep INP low. Coalesce bursts of updates.
const PERSIST_DEBOUNCE_MS = 600;
let _flushTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingPush = false;
let _lastPushedHash: string | null = null;

function hashItems(items: CartItem[]): string {
  // Stable, cheap hash: id + quantity only (ignores product metadata churn).
  return items
    .map((i) => `${i.product.id}:${i.quantity}`)
    .sort()
    .join("|");
}

function flushPersistence() {
  _flushTimer = null;
  const snapshot = _items;
  saveToLS(snapshot);
  const shouldPush = _pendingPush && _serverSyncEnabled && _userId && !_suppressNextPush;
  _pendingPush = false;
  if (_suppressNextPush) _suppressNextPush = false;
  if (shouldPush) {
    const h = hashItems(snapshot);
    if (h === _lastPushedHash) return; // dedup: identical payload already on server
    _lastPushedHash = h;
    void pushToServer(snapshot);
  }
}

function schedulePersist(push: boolean) {
  if (push) _pendingPush = true;
  if (_flushTimer) return;
  _flushTimer = setTimeout(flushPersistence, PERSIST_DEBOUNCE_MS);
}

function setItems(next: CartItem[], opts: { push?: boolean } = {}) {
  _items = next;
  notify();
  schedulePersist(opts.push ?? false);
}

async function pushToServer(items: CartItem[]) {
  if (!_userId) return;
  const { error } = await supabase.from("user_carts").upsert(
    { user_id: _userId, items: items as any, updated_at: new Date().toISOString() } as any,
    { onConflict: "user_id" }
  );
  if (error) {
    // Let the next change retry the push
    _lastPushedHash = null;
  }
}

/** Reset dedup hash so the next change re-syncs (e.g. after login/logout). */
function resetPushDedup() {
  _lastPushedHash = null;
}

// Tracks last user we ran onLogin/onLogout for. Module-level so it survives
// CartSyncProvider remounts (StrictMode, HMR) — otherwise we'd re-run the
// login merge on every remount and generate spurious upserts.
let _lastAuthUser: string | null = null;
let _loginInFlight: Promise<void> | null = null;

/** Called by CartSyncProvider when auth state changes. */
export const cartSync = {
  async onLogin(userId: string) {
    if (_lastAuthUser === userId) return;
    if (_loginInFlight) return _loginInFlight;
    _lastAuthUser = userId;
    _userId = userId;
    _serverSyncEnabled = true;
    resetPushDedup();

    _loginInFlight = (async () => {
      const local = _items;
      const { data } = await supabase
        .from("user_carts")
        .select("items")
        .eq("user_id", userId)
        .maybeSingle();

      const server: CartItem[] = Array.isArray((data as any)?.items)
        ? ((data as any).items as CartItem[]).filter((i) => i?.product?.id)
        : [];

      const localHas = local.length > 0;
      const serverHas = server.length > 0;

      if (!localHas && !serverHas) return;
      if (!localHas && serverHas) {
        _suppressNextPush = true;
        setItems(server);
        toast.success("Seu carrinho foi restaurado 🛒");
        return;
      }
      if (localHas && !serverHas) {
        setItems(local, { push: true });
        toast.success("Seus itens foram salvos no carrinho");
        return;
      }
      // Both have items → silently merge
      const merged = mergeCarts(local, server);
      setItems(merged, { push: true });
      toast.success("Carrinhos mesclados 🛒");
    })().finally(() => { _loginInFlight = null; });

    return _loginInFlight;
  },


  onLogout() {
    if (_lastAuthUser === null) return;
    _lastAuthUser = null;
    _userId = null;
    _serverSyncEnabled = false;
    resetPushDedup();
    // keep local cart as temporary session
  },

  /** Apply realtime update from server (do not push back). */
  applyServerSnapshot(items: CartItem[]) {
    _suppressNextPush = true;
    // Server is source of truth — align dedup hash so we don't push it back.
    _lastPushedHash = hashItems(items);
    setItems(items);
  },

  getUserId() { return _userId; },
};

function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const byId = new Map<string, CartItem>();
  for (const it of a) byId.set(it.product.id, { ...it });
  for (const it of b) {
    const ex = byId.get(it.product.id);
    if (ex) ex.quantity = Math.max(ex.quantity, it.quantity);
    else byId.set(it.product.id, { ...it });
  }
  return Array.from(byId.values());
}

// ------- Hook -------
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function getSnapshot() { return _items; }

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addItem = useCallback((product: Product, maxStock: number = 99) => {
    const existing = _items.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= maxStock) {
        toast.error(`Estoque máximo atingido (${maxStock})`);
        return;
      }
      setItems(
        _items.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)),
        { push: true }
      );
    } else {
      if (maxStock <= 0) { toast.error("Produto indisponível"); return; }
      setItems([..._items, { product, quantity: 1 }], { push: true });
    }
    toast.success("✅ Produto adicionado ao carrinho!", {
      duration: 2000,
      style: { background: "#00B894", color: "#FFFFFF", border: "none" },
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    const existing = _items.find((i) => i.product.id === productId);
    if (existing && existing.quantity > 1) {
      setItems(
        _items.map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i)),
        { push: true }
      );
    } else {
      setItems(_items.filter((i) => i.product.id !== productId), { push: true });
    }
  }, []);

  const getQuantity = useCallback(
    (productId: string) => items.find((i) => i.product.id === productId)?.quantity || 0,
    [items]
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + getEffectivePrice(i.product) * i.quantity, 0);

  const clearCart = useCallback(() => setItems([], { push: true }), []);

  const setCartFromProducts = useCallback((entries: { product: Product; quantity: number }[]) => {
    const next = entries.map((e) => ({ product: e.product, quantity: Math.max(1, e.quantity) }));
    setItems(next, { push: true });
    if (next.length) toast.success("Itens adicionados ao carrinho 🛒");
    else toast.error("Os produtos deste pedido não estão mais disponíveis");
  }, []);

  return { items, addItem, removeItem, getQuantity, totalItems, totalPrice, clearCart, setCartFromProducts };
}
