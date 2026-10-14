import Link from "next/link";
import { SearchBar } from "@/components/store/search-bar";

export function NotFoundContent() {
  return (
    <div className="container-store flex flex-col items-center py-20 text-center sm:py-28">
      <p className="text-8xl font-black text-brand-text sm:text-9xl" aria-hidden>
        404
      </p>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">We could not find that page</h1>
      <p className="mt-3 max-w-lg text-lg text-muted-foreground">
        The link may be old or mistyped. Try searching for what you need, or go back to the shop.
      </p>
      <div className="mt-8 w-full max-w-xl">
        <SearchBar />
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex h-12 items-center rounded-xl bg-foreground px-6 font-semibold text-background">
          Go to the home page
        </Link>
        <Link href="/shop" className="inline-flex h-12 items-center rounded-xl border-2 border-foreground px-6 font-semibold">
          Browse all products
        </Link>
      </div>
    </div>
  );
}
