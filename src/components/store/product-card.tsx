"use client";

import Link from "next/link";
import { useRef } from "react";
import { ShoppingBag } from "lucide-react";
import type { ProductCardData } from "@/server/catalog";
import { useMoney } from "@/components/store-context";
import { cart } from "@/lib/cart/cart-store";
import { ProductImage } from "@/components/store/product-image";


export function StockNote({ stock, low }: { stock: number; low: boolean }) {
  if (stock <= 0) return <span className="font-semibold text-destructive">Out of stock</span>;
  if (low) return <span className="font-semibold text-warning">Only {stock} left</span>;
  return <span className="font-medium text-success">In stock</span>;
}

/** Product card with a soft 3D tilt + lift on hover (off for reduced motion / touch). */
export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const money = useMoney();
  const ref = useRef<HTMLDivElement>(null);
  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-6px)`;
  }
  function onLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:shadow-2xl hover:shadow-black/10"
    >
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted" tabIndex={-1} aria-hidden>
        <ProductImage
          src={product.image}
          alt=""
          priority={priority}
          sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
          className="transition duration-500 group-hover:scale-[1.04]"
        />
        {product.hoverImage && (
          <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <ProductImage src={product.hoverImage} alt="" sizes="(min-width: 1280px) 300px, 50vw" />
          </span>
        )}
        <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {discount > 0 && <span className="rounded-full bg-brand px-2.5 py-1 text-sm font-bold text-brand-foreground">Save {discount}%</span>}
          {product.stock <= 0 && <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-sm font-semibold text-white">Sold out</span>}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {product.brand && <span className="font-medium text-muted-foreground">{product.brand}</span>}
        </div>
        <h3 className="text-[1.05rem] leading-snug font-semibold">
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.title}
          </Link>
        </h3>
        <div className="mt-auto pt-2">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-bold">
              {product.hasVariants && <span className="text-base font-medium">From </span>}
              {money(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-muted-foreground line-through">
                <span className="sr-only">Was </span>
                {money(product.compareAtPrice)}
              </span>
            )}
          </p>
          <p className="text-[0.95rem]">
            <StockNote stock={product.stock} low={product.lowStock} />
          </p>
        </div>
        <div className="relative z-10 pt-3">
          {product.quickAdd ? (
            <button
              type="button"
              onClick={() =>
                cart.add({
                  productId: product.id,
                  variantId: null,
                  slug: product.slug,
                  title: product.title,
                  variantName: null,
                  image: product.image,
                  price: product.price,
                  maxQty: product.stock,
                })
              }
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground font-semibold text-background transition hover:opacity-90"
            >
              <ShoppingBag className="size-5" aria-hidden />
              Add to cart<span className="sr-only">: {product.title}</span>
            </button>
          ) : (
            <Link
              href={`/product/${product.slug}`}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border-2 border-foreground font-semibold transition hover:bg-foreground hover:text-background"
            >
              {product.stock > 0 ? "Choose options" : "View details"}
              <span className="sr-only">: {product.title}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
