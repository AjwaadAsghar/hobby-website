import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getActiveCategories,
  getFacetOptions,
  listProducts,
  SORT_OPTIONS,
  type ListingFilters as Filters,
} from "@/server/catalog";
import { ProductGrid } from "@/components/store/product-card";
import { ListingFilters, SortSelect } from "@/components/store/listing-filters";
import { cn } from "@/lib/utils";

function pageHref(basePath: string, sp: Record<string, string | string[] | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || v === undefined) continue;
    params.set(k, Array.isArray(v) ? v.join(",") : v);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function Pagination({ page, pageCount, basePath, sp }: { page: number; pageCount: number; basePath: string; sp: Record<string, string | string[] | undefined> }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);
  const btn = "inline-flex h-12 min-w-12 items-center justify-center gap-1 rounded-xl border-2 px-4 font-semibold";
  return (
    <nav aria-label="Pages" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={pageHref(basePath, sp, page - 1)} className={cn(btn, "border-input hover:bg-muted")}>
          <ChevronLeft className="size-5" aria-hidden /> Previous
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - pages[i - 1] > 1 && <span aria-hidden className="px-1">…</span>}
          <Link
            href={pageHref(basePath, sp, p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={cn(btn, p === page ? "border-foreground bg-foreground text-background" : "border-input hover:bg-muted")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={pageHref(basePath, sp, page + 1)} className={cn(btn, "border-input hover:bg-muted")}>
          Next <ChevronRight className="size-5" aria-hidden />
        </Link>
      )}
    </nav>
  );
}

export async function ProductListing({
  filters,
  searchParams,
  basePath,
  title,
  description,
  showCategoryFilter,
}: {
  filters: Filters;
  searchParams: Record<string, string | string[] | undefined>;
  basePath: string;
  title: string;
  description?: string;
  showCategoryFilter?: boolean;
}) {
  const [result, facets, categories] = await Promise.all([
    listProducts(filters),
    getFacetOptions(filters.category),
    showCategoryFilter ? getActiveCategories() : Promise.resolve([]),
  ]);
  const sort = filters.sort ?? (filters.q ? "relevance" : "featured");
  const sortOptions = filters.q ? [{ value: "relevance", label: "Best match" }, ...SORT_OPTIONS] : SORT_OPTIONS;
  const activeCount =
    (filters.brands?.length ?? 0) + (filters.inStock ? 1 : 0) + (filters.minPrice || filters.maxPrice ? 1 : 0) + (showCategoryFilter && filters.category ? 1 : 0);

  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);

  return (
    <div className="container-store py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-12">
        <ListingFilters
          basePath={basePath}
          activeCount={activeCount}
          facets={{ ...facets, categories: showCategoryFilter ? categories.map((c) => ({ slug: c.slug, name: c.name })) : undefined }}
          state={{
            q: filters.q,
            category: filters.category,
            brands: filters.brands ?? [],
            min: filters.minPrice,
            max: filters.maxPrice,
            inStock: !!filters.inStock,
            sort: filters.sort,
          }}
        />
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg" role="status">
              {result.total === 0 ? (
                "No products found"
              ) : (
                <>
                  Showing <strong>{from}–{to}</strong> of <strong>{result.total}</strong> {result.total === 1 ? "product" : "products"}
                </>
              )}
            </p>
            <SortSelect value={sort} options={sortOptions} />
          </div>
          {result.products.length > 0 ? (
            <ProductGrid products={result.products} priorityCount={4} />
          ) : (
            <div className="rounded-3xl border-2 border-dashed p-10 text-center">
              <p className="text-xl font-semibold">Nothing matches these filters</p>
              <p className="mt-2 text-muted-foreground">Try removing a filter, or search with different words.</p>
              <Link href={basePath} className="mt-6 inline-flex h-12 items-center rounded-xl bg-foreground px-6 font-semibold text-background">
                Clear all filters
              </Link>
            </div>
          )}
          <Pagination page={result.page} pageCount={result.pageCount} basePath={basePath} sp={searchParams} />
        </div>
      </div>
    </div>
  );
}
