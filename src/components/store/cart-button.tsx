"use client";

import { ShoppingBag } from "lucide-react";
import { cart, cartCount, useCart } from "@/lib/cart/cart-store";
import { cn } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const { lines } = useCart();
  const count = cartCount(lines);
  return (
    <button
      type="button"
      onClick={() => cart.openDrawer()}
      className={cn(
        "relative inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-3.5 font-semibold text-background transition hover:opacity-90 sm:px-5",
        className,
      )}
    >
      <ShoppingBag className="hidden size-5 min-[440px]:block" aria-hidden />
      <span>Cart</span>
      <span
        className={cn(
          "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-sm font-bold",
          count > 0 ? "bg-brand text-brand-foreground" : "bg-background/20",
        )}
      >
        {count}
        <span className="sr-only"> {count === 1 ? "item" : "items"}</span>
      </span>
    </button>
  );
}
