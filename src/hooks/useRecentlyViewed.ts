import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "homelast.recentlyViewed";
const MAX = 6;

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch { return []; }
}

const listeners = new Set<() => void>();
let cache = typeof window !== "undefined" ? read() : [];

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch {}
  listeners.forEach((l) => l());
}

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(cache);

  useEffect(() => {
    const l = () => setIds([...cache]);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const track = useCallback((productId: string) => {
    if (!productId) return;
    cache = [productId, ...cache.filter((id) => id !== productId)].slice(0, MAX);
    persist();
  }, []);

  const clear = useCallback(() => { cache = []; persist(); }, []);

  return { ids, track, clear };
}
