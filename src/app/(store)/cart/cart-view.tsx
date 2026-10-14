"use client";

import Link from "next/link";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import { cart, cartSubtotal, useCart } from "@/lib/cart/cart-store";
import { useQuote } from "@/lib/cart/use-quote";
import { useMoney } from "@/components/store-context";
import { ProductImage } from "@/components/store/product-image";
import { QtyStepper } from "@/components/store/qty-stepper";
import { FreeShippingBar } from "@/components/store/cart-drawer";
import { DiscountField } from "@/components/store/discount-field";
import { CheckoutSteps } from "@/components/store/checkout-steps";

export function CartView() {
  const { lines, discountCode } = useCart();
  const { quote, loading, error } = useQuote(lines, discountCode);
  const money = useMoney();
  const subtotal = quote?.subtotal ?? cartSubtotal(lines);
  const discount = quote?.discount?.valid ? quote.discount.amount : 0;

  return (
    <div className="container-store py-10">
      <CheckoutSteps current={1} />
      <h1 className="text-4xl font-bold">Your cart</h1>

      {lines.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-16 text-center">
          <ShoppingBag className="size-14 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-xl font-semibold">Your cart is empty</p>
          <p className="mt-2 text-muted-foreground">Browse our range and add something you like.</p>
          <Link href="/shop" className="mt-6 inline-flex h-14 items-center rounded-xl bg-brand px-8 text-lg font-semibold text-brand-foreground">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            {(quote?.problems.length ?? 0) > 0 && (
              <div role="alert" className="mb-6 rounded-2xl border-2 border-warning/50 bg-warning/10 p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="size-5" aria-hidden /> Some items changed
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  {quote!.problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            <ul className="divide-y rounded-3xl border">
              {lines.map((l) => {
                const q = quote?.lines.find((x) => x.key === l.key);
                return (
                  <li key={l.key} className="flex gap-4 p-4 sm:gap-6 sm:p-6">
                    <Link href={`/product/${l.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-muted sm:size-32">
                      <ProductImage src={l.image} alt={l.title} sizes="128px" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-between">
                      <div className="min-w-0">
                        <Link href={`/product/${l.slug}`} className="text-lg font-semibold hover:underline">
                          {l.title}
                        </Link>
                        {l.variantName && <p className="text-muted-foreground">{l.variantName}</p>}
                        <p className="mt-1">{money(l.price)} each</p>
                        {q?.problem && <p className="mt-1 font-medium text-destructive">{q.problem}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          <QtyStepper value={l.qty} max={Math.max(1, l.maxQty)} onChange={(n) => cart.setQty(l.key, n)} label={`Quantity for ${l.title}`} />
                          <button type="button" onClick={() => cart.remove(l.key)} className="font-medium underline underline-offset-4 hover:text-destructive">
                            Remove
                          </button>
                        </div>
                      </div>
                      <p className="text-xl font-bold sm:text-right">{money(l.price * l.qty)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link href="/shop" className="mt-6 inline-flex h-12 items-center font-semibold underline underline-offset-4">
              ← Continue shopping
            </Link>
          </div>

          <aside aria-label="Order summary" className="h-fit space-y-5 rounded-3xl border bg-muted/40 p-6 lg:sticky lg:top-40">
            <h2 className="text-2xl font-bold">Order summary</h2>
            <FreeShippingBar subtotal={subtotal - discount} />
            <DiscountField code={discountCode} quote={quote} />
            <dl className="space-y-2 text-lg">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-semibold">{money(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount ({quote?.discount?.code})</dt>
                  <dd className="font-semibold">−{money(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd className="text-muted-foreground">Calculated next step</dd>
              </div>
              <div className="flex justify-between border-t pt-3 text-xl">
                <dt className="font-bold">Total so far</dt>
                <dd className="font-bold">{money(subtotal - discount)}</dd>
              </div>
            </dl>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <Link
              href="/checkout"
              aria-disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-xl bg-brand text-lg font-semibold text-brand-foreground shadow-sm hover:brightness-110"
            >
              Continue to checkout
            </Link>
            <p className="text-center text-[0.95rem] text-muted-foreground">No account needed. Pay cash on delivery or by bank transfer.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
