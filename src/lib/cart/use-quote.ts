"use client";

import { useEffect, useMemo, useState } from "react";
import { cart, type CartLine } from "@/lib/cart/cart-store";

export type ClientQuote = {
  lines: {
    key: string;
    unitPrice: number;
    qty: number;
    maxQty: number;
    lineTotal: number;
    title: string;
    image: string | null;
    problem: string | null;
  }[];
  subtotal: number;
  discount: { code: string; amount: number; valid: boolean; message: string } | null;
  shipping: { zone: string; amount: number; free: boolean } | null;
  total: number;
  problems: string[];
};

/** Asks the server for authoritative prices, stock, discount and delivery. */
export function useQuote(lines: CartLine[], discountCode: string, city?: string) {
  const [quote, setQuote] = useState<ClientQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payload = useMemo(
    () =>
      JSON.stringify({
        lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
        discountCode: discountCode || undefined,
        city: city || undefined,
      }),
    [lines, discountCode, city],
  );

  useEffect(() => {
    if (!lines.length) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: ctrl.signal });
        if (!res.ok) throw new Error("quote failed");
        const q = (await res.json()) as ClientQuote;
        setQuote(q);
        cart.sync(q.lines.map((l) => ({ key: l.key, price: l.unitPrice, maxQty: l.maxQty, title: l.title, image: l.image })));
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("We could not check prices right now. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  return { quote: lines.length ? quote : null, loading, error };
}
