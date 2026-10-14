"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap } from "lucide-react";
import { cart } from "@/lib/cart/cart-store";
import { useMoney } from "@/components/store-context";
import { QtyStepper } from "@/components/store/qty-stepper";
import { cn } from "@/lib/utils";

type Variant = { id: string; name: string; options: Record<string, string>; price: number; stock: number };

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    image: string | null;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    lowStockThreshold: number;
  };
  variants: Variant[];
};

/** Price, stock, option pickers, quantity and add-to-cart for the product page. */
export function ProductPurchase({ product, variants }: Props) {
  const money = useMoney();
  const router = useRouter();
  const optionNames = useMemo(() => [...new Set(variants.flatMap((v) => Object.keys(v.options)))], [variants]);
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(firstAvailable?.options ?? {});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.length
    ? variants.find((v) => optionNames.every((n) => (v.options[n] ?? "") === (selected[n] ?? ""))) ?? null
    : null;
  const price = variant ? variant.price : product.price;
  const stock = variants.length ? (variant?.stock ?? 0) : product.stock;
  const compare = product.compareAtPrice && product.compareAtPrice > price ? product.compareAtPrice : null;
  const needsChoice = variants.length > 0 && !variant;

  function valuesFor(name: string) {
    return [...new Set(variants.map((v) => v.options[name]).filter(Boolean))];
  }
  function isAvailable(name: string, value: string) {
    return variants.some((v) => v.options[name] === value && v.stock > 0 && optionNames.every((n) => n === name || !selected[n] || v.options[n] === selected[n]));
  }

  function add(goToCheckout: boolean) {
    if (needsChoice || stock <= 0) return;
    cart.add(
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        slug: product.slug,
        title: product.title,
        variantName: variant?.name ?? null,
        image: product.image,
        price,
        maxQty: stock,
      },
      qty,
      !goToCheckout,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
    if (goToCheckout) router.push("/checkout");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-4xl font-bold tracking-tight">{money(price)}</span>
          {compare && (
            <>
              <span className="text-xl text-muted-foreground line-through">
                <span className="sr-only">Was </span>
                {money(compare)}
              </span>
              <span className="rounded-full bg-brand px-3 py-1 text-[0.95rem] font-bold text-brand-foreground">Save {money(compare - price)}</span>
            </>
          )}
        </p>
        <p className="mt-2 text-lg" role="status" aria-live="polite">
          {needsChoice ? (
            <span className="font-medium">Please choose an option below</span>
          ) : stock <= 0 ? (
            <span className="font-semibold text-destructive">Out of stock{variants.length ? " in this option" : ""}</span>
          ) : stock <= product.lowStockThreshold ? (
            <span className="font-semibold text-warning">Only {stock} left - order soon</span>
          ) : (
            <span className="font-semibold text-success">In stock, ready to ship</span>
          )}
        </p>
      </div>

      {optionNames.map((name) => (
        <fieldset key={name}>
          <legend className="mb-2 text-lg font-semibold">
            {name}: <span className="font-normal">{selected[name] ?? "Choose one"}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {valuesFor(name).map((value) => {
              const active = selected[name] === value;
              const available = isAvailable(name, value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelected((s) => ({ ...s, [name]: value }));
                    setQty(1);
                  }}
                  className={cn(
                    "min-h-12 rounded-xl border-2 px-4 font-semibold transition",
                    active ? "border-foreground bg-foreground text-background" : "border-input hover:border-foreground",
                    !available && !active && "text-muted-foreground line-through decoration-2",
                  )}
                >
                  {value}
                  {!available && <span className="sr-only"> (out of stock)</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <span className="mb-2 block text-lg font-semibold" id="qty-label">
            Quantity
          </span>
          <QtyStepper value={qty} max={Math.max(1, stock)} onChange={setQty} size="lg" label="Quantity" />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => add(false)}
          disabled={needsChoice || stock <= 0}
          className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-semibold text-brand-foreground shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="size-5" aria-hidden />
          {added ? "Added to cart ✓" : stock <= 0 && !needsChoice ? "Out of stock" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={() => add(true)}
          disabled={needsChoice || stock <= 0}
          className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-foreground px-6 text-lg font-semibold transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Zap className="size-5" aria-hidden /> Buy now
        </button>
      </div>
    </div>
  );
}
