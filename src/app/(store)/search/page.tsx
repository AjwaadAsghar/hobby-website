import type { Metadata } from "next";
import { parseListingParams } from "@/server/catalog";
import { ProductListing } from "@/components/store/product-listing";
import { SearchBar } from "@/components/store/search-bar";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = (await searchParams).q;
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const filters = parseListingParams(sp);
  if (!filters.q) {
    return (
      <div className="container-store py-16">
        <h1 className="text-4xl font-bold">Search</h1>
        <p className="mt-3 text-lg text-muted-foreground">Type what you are looking for. Small spelling mistakes are fine.</p>
        <div className="mt-8 max-w-2xl">
          <SearchBar autoFocus />
        </div>
      </div>
    );
  }
  return (
    <ProductListing
      filters={filters}
      searchParams={sp}
      basePath="/search"
      title={`Results for “${filters.q}”`}
      description="Not what you wanted? Try another word, or ask us on WhatsApp."
      showCategoryFilter
    />
  );
}
