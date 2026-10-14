"use client";

import { createContext, useCallback, useContext } from "react";
import { formatMoney } from "@/lib/money";

/** The subset of settings that client components need. Comes from the DB. */
export type PublicStore = {
  storeName: string;
  tagline: string;
  logoUrl: string;
  whatsapp: string;
  phone: string;
  email: string;
  currency: string;
  locale: string;
  freeShippingThreshold: number;
};

const StoreContext = createContext<PublicStore | null>(null);

export function StoreProvider({ value, children }: { value: PublicStore; children: React.ReactNode }) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): PublicStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export function useMoney() {
  const { currency, locale } = useStore();
  return useCallback((minor: number) => formatMoney(minor, { currency, locale }), [currency, locale]);
}
