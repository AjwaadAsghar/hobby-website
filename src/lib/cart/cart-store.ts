"use client";

import { useSyncExternalStore } from "react";

/**
 * Cart kept in localStorage so it survives visits. Prices stored here are for
 * display only; the server recalculates everything at checkout.
 */
export type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  variantName: string | null;
  image: string | null;
  price: number;
  qty: number;
  maxQty: number;
};

type CartState = {
  lines: CartLine[];
  discountCode: string;
  drawerOpen: boolean;
};

const KEY = "store-cart-v1";
const empty: CartState = { lines: [], discountCode: "", drawerOpen: false };
let state: CartState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CartState>;
      state = {
        ...empty,
        lines: Array.isArray(parsed.lines) ? parsed.lines.filter((l) => l && l.productId && l.qty > 0) : [],
        discountCode: typeof parsed.discountCode === "string" ? parsed.discountCode : "",
      };
    }
  } catch {
    state = empty;
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    emit();
  });
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ lines: state.lines, discountCode: state.discountCode }));
  } catch {
    /* storage full or blocked - cart still works for this visit */
  }
}

function emit() {
  for (const l of listeners) l();
}

function set(next: Partial<CartState>, save = true) {
  state = { ...state, ...next };
  if (save) persist();
  emit();
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  load();
  return state;
}

function getServerSnapshot() {
  return empty;
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const lineKey = (productId: string, variantId: string | null) => `${productId}:${variantId ?? "-"}`;

export const cart = {
  add(line: Omit<CartLine, "key" | "qty">, qty = 1, openDrawer = true) {
    load();
    const key = lineKey(line.productId, line.variantId);
    const existing = state.lines.find((l) => l.key === key);
    const max = Math.max(1, line.maxQty);
    const lines = existing
      ? state.lines.map((l) => (l.key === key ? { ...l, ...line, qty: Math.min(max, l.qty + qty) } : l))
      : [...state.lines, { ...line, key, qty: Math.min(max, qty) }];
    set({ lines, drawerOpen: openDrawer ? true : state.drawerOpen });
  },
  setQty(key: string, qty: number) {
    const lines = state.lines
      .map((l) => (l.key === key ? { ...l, qty: Math.max(0, Math.min(Math.max(1, l.maxQty), Math.floor(qty))) } : l))
      .filter((l) => l.qty > 0);
    set({ lines });
  },
  remove(key: string) {
    set({ lines: state.lines.filter((l) => l.key !== key) });
  },
  /** Applies authoritative data from the server (price, stock limits). */
  sync(updates: { key: string; price: number; maxQty: number; title?: string; image?: string | null }[]) {
    const lines = state.lines.map((l) => {
      const u = updates.find((x) => x.key === l.key);
      if (!u) return l;
      return { ...l, price: u.price, maxQty: u.maxQty, title: u.title ?? l.title, image: u.image ?? l.image, qty: Math.min(l.qty, Math.max(u.maxQty, 0)) || l.qty };
    });
    set({ lines });
  },
  setDiscountCode(code: string) {
    set({ discountCode: code.trim().toUpperCase() });
  },
  clear() {
    set({ lines: [], discountCode: "" });
  },
  openDrawer() {
    set({ drawerOpen: true }, false);
  },
  closeDrawer() {
    set({ drawerOpen: false }, false);
  },
};

export function cartCount(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.price * l.qty, 0);
}
