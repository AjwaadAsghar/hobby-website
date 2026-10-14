import Link from "next/link";
import { Phone, User, PackageSearch } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getActiveCategories } from "@/server/catalog";
import { formatMoney } from "@/lib/money";
import { telLink } from "@/lib/format";
import { Logo } from "@/components/store/logo";
import { SearchBar } from "@/components/store/search-bar";
import { CartButton } from "@/components/store/cart-button";
import { MobileMenu } from "@/components/store/mobile-menu";
import { TextSizeToggle } from "@/components/store/text-size-toggle";
import { ThemeToggle } from "@/components/store/theme-toggle";
import { NavLinks } from "@/components/store/nav-links";

export async function Header() {
  const [s, categories] = await Promise.all([getSettings(), getActiveCategories()]);
  const cats = categories.map((c) => ({ name: c.name, slug: c.slug }));
  const threshold = s.commerce.freeShippingThreshold;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="bg-foreground text-background">
        <div className="container-store flex min-h-10 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-1.5 text-sm">
          <p className="font-medium">
            {threshold > 0 ? (
              <>Free delivery over {formatMoney(threshold, { currency: s.commerce.currency, locale: s.commerce.locale })}<span className="hidden sm:inline"> · Competitive prices on every order</span></>
            ) : (
              <>Fast delivery across Pakistan</>
            )}
          </p>
          <div className="flex items-center gap-4">
            <TextSizeToggle className="hidden lg:flex" />
            <ThemeToggle className="hidden text-background hover:bg-white/15 lg:inline-flex" />
            {s.contact.phone && (
              <a href={telLink(s.contact.phone)} className="inline-flex items-center gap-1.5 font-medium hover:underline">
                <Phone className="size-4" aria-hidden />
                <span>Call {s.contact.phone}</span>
              </a>
            )}
            <Link href="/track" className="hidden items-center gap-1.5 font-medium hover:underline sm:inline-flex">
              <PackageSearch className="size-4" aria-hidden /> Track my order
            </Link>
          </div>
        </div>
      </div>

      <header className="z-40 border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 lg:sticky lg:top-0">
        <div className="container-store flex flex-wrap items-center gap-2 py-3 sm:gap-3 lg:flex-nowrap lg:gap-6">
          <MobileMenu categories={cats} />
          <Link href="/" className="shrink-0 rounded-lg" aria-label={`${s.branding.storeName} home page`}>
            <Logo name={s.branding.storeName} logoUrl={s.branding.logoUrl} compact />
          </Link>
          <SearchBar className="hidden max-w-2xl flex-1 lg:block" />
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/account"
              className="hidden h-12 items-center gap-2 rounded-full px-4 font-semibold hover:bg-muted sm:inline-flex"
            >
              <User className="size-5" aria-hidden />
              Account
            </Link>
            <CartButton />
          </div>
        </div>
        <div className="container-store pb-3 lg:hidden">
          <SearchBar />
        </div>
        <div className="hidden border-t lg:block">
          <div className="container-store">
            <NavLinks categories={cats} />
          </div>
        </div>
      </header>
    </>
  );
}
