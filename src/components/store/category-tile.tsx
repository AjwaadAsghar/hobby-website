"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/store/product-image";

/** Category tile with subtle parallax depth on scroll. */
export function CategoryTile({ name, slug, image, count }: { name: string; slug: string; image: string | null; count: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-7%", "7%"]);

  return (
    <Link
      ref={ref}
      href={`/category/${slug}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl bg-muted p-5 shadow-sm transition-shadow hover:shadow-xl sm:aspect-square"
    >
      <motion.span style={{ y }} className="absolute -inset-[8%] block">
        <ProductImage src={image} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="transition duration-700 group-hover:scale-105" />
      </motion.span>
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" aria-hidden />
      <span className="relative text-white">
        <span className="block text-xl leading-tight font-bold sm:text-2xl">{name}</span>
        <span className="mt-1 inline-flex items-center gap-1.5 font-medium text-white/90">
          {count} {count === 1 ? "product" : "products"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </span>
    </Link>
  );
}
