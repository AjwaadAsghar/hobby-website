"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Visible category names - no hidden mega menus. */
export function NavLinks({ categories }: { categories: { name: string; slug: string }[] }) {
  const pathname = usePathname();
  const items = [{ href: "/shop", label: "All products" }, ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name }))];
  return (
    <nav aria-label="Product categories">
      <ul className="flex flex-wrap items-center gap-x-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-12 items-center px-2.5 text-[0.95rem] font-medium whitespace-nowrap transition-colors hover:text-brand",
                  active && "font-semibold text-brand after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] after:rounded-full after:bg-brand",
                )}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
