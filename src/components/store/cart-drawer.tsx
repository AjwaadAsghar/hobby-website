"use client";

import Link from "next/link";
import { ShoppingBag, Truck } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cart, cartCount, cartSubtotal, useCart } from "@/lib/cart/cart-store";
import { useMoney, useStore } from "@/components/store-context";
import { ProductImage } from "@/components/store/product-image";
import { QtyStepper } from "@/components/store/qty-stepper";

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const { freeShippingThreshold } = useStore();
  const money = useMoney();
  if (!freeShippingThreshold) return null;
  const remaining = freeShippingThreshold - subtotal;
  const pct = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  return (
    <div className="rounded-xl bg-muted px-4 py-3">
      <p className="flex items-center gap-2 font-medium">
        <Truck className="size-5 shrink-0" aria-hidden />
        {remaining > 0 ? (
          <span>
            Add <strong>{money(remaining)}</strong> more for <strong>free delivery</strong>
          </span>
        ) : (
          <span>
            You get <strong>free delivery</strong> on this order
          </span>
        )}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free delivery">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { lines, drawerOpen } = useCart();
  const money = useMoney();
  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);

  return (
    <Sheet open={drawerOpen} onOpenChange={(o) => (o ? cart.openDrawer() : cart.closeDrawer())}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-xl">Your cart ({count})</SheetTitle>
          <SheetDescription className="sr-only">Items in your shopping cart</SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="size-14 text-muted-foreground" aria-hidden />
            <p className="text-lg font-medium">Your cart is empty</p>
            <Button asChild size="lg" variant="brand" onClick={() => cart.closeDrawer()}>
              <Link href="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FreeShippingBar subtotal={subtotal} />
              <ul className="mt-4 divide-y">
                {lines.map((l) => (
                  <li key={l.key} className="flex gap-4 py-4">
                    <Link
                      href={`/product/${l.slug}`}
                      onClick={() => cart.closeDrawer()}
                      className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                    >
                      <ProductImage src={l.image} alt={l.title} sizes="80px" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/product/${l.slug}`} onClick={() => cart.closeDrawer()} className="line-clamp-2 font-medium hover:underline">
                        {l.title}
                      </Link>
                      {l.variantName && <p className="text-sm text-muted-foreground">{l.variantName}</p>}
                      <p className="mt-1 font-semibold">{money(l.price)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <QtyStepper value={l.qty} max={l.maxQty} onChange={(n) => cart.setQty(l.key, n)} label={`Quantity for ${l.title}`} />
                        <button type="button" onClick={() => cart.remove(l.key)} className="text-sm font-medium underline underline-offset-4 hover:text-destructive">
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 border-t bg-background px-5 py-4">
              <div className="flex items-center justify-between text-lg">
                <span>Subtotal</span>
                <span className="font-bold">{money(subtotal)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Delivery and discounts are calculated at checkout.</p>
              <Button asChild size="lg" variant="brand" className="w-full" onClick={() => cart.closeDrawer()}>
                <Link href="/checkout">Checkout</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full" onClick={() => cart.closeDrawer()}>
                <Link href="/cart">View full cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
