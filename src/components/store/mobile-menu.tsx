"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TextSizeToggle } from "@/components/store/text-size-toggle";
import { ThemeToggle } from "@/components/store/theme-toggle";

type Cat = { name: string; slug: string };

export function MobileMenu({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-12 items-center gap-1 rounded-full border-2 border-input px-2.5 font-semibold lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
          Menu
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-xl">Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Menu" className="px-2 py-3">
          <Link href="/shop" onClick={close} className="flex items-center justify-between rounded-xl px-3 py-3.5 text-lg font-semibold hover:bg-muted">
            Shop now <ChevronRight className="size-5" aria-hidden />
          </Link>
          {categories.length > 0 && (
            <>
              <p className="mt-4 px-3 pb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Categories</p>
              <ul>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/category/${c.slug}`} onClick={close} className="flex items-center justify-between rounded-xl px-3 py-3.5 text-lg hover:bg-muted">
                      {c.name} <ChevronRight className="size-5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 px-3 pb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Help</p>
          <ul>
            {[
              ["/track", "Track my order"],
              ["/account", "My account"],
              ["/contact", "Contact us"],
              ["/faq", "FAQ"],
              ["/shipping-policy", "Shipping"],
              ["/returns-policy", "Returns"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} onClick={close} className="block rounded-xl px-3 py-3 text-lg hover:bg-muted">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-3 border-t px-5 py-4">
          <TextSizeToggle />
          <ThemeToggle className="-ml-2.5" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
