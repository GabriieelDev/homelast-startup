import { useSyncExternalStore } from "react";

// Tiny shared store so the bottom nav and the header cart icon open the same drawer.
let _open = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (_open === next) return;
  _open = next;
  listeners.forEach((l) => l());
}

export const cartDrawer = {
  open: () => set(true),
  close: () => set(false),
  setOpen: set,
};

export function useCartDrawerOpen() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
    () => _open,
    () => false,
  );
}
