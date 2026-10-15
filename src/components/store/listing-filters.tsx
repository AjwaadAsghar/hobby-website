"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/components/store-context";

export type FilterState = {
  q?: string;
  category?: string;
  brands: string[];
  min?: number;
  max?: number;
  inStock: boolean;
  sort?: string;
};

type Facets = {
  brands: { value: string; count: number }[];
  categories?: { slug: string; name: string }[];
  minPrice: number;
  maxPrice: number;
};

function buildQuery(form: HTMLFormElement): string {
  const fd = new FormData(form);
  const params = new URLSearchParams();
  const brand = fd.getAll("brand").map(String);
  for (const [k, v] of fd.entries()) {
    if (k === "brand") continue;
    if (String(v).trim()) params.set(k, String(v).trim());
  }
  if (brand.length) params.set("brand", brand.join(","));
  return params.toString();
}

function Checkbox({ name, value, label, defaultChecked, onChange, count }: { name: string; value: string; label: string; defaultChecked: boolean; onChange: () => void; count?: number }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} onChange={onChange} className="size-5 shrink-0 accent-[var(--brand)]" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-sm text-muted-foreground">{count}</span>}
    </label>
  );
}

function FilterFields({ state, facets, basePath, autoSubmit }: { state: FilterState; facets: Facets; basePath: string; autoSubmit: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { currency } = useStore();

  const apply = () => {
    if (!formRef.current) return;
    const qs = buildQuery(formRef.current);
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };
  const onChange = () => {
    if (autoSubmit) apply();
  };

  return (
    <form
      ref={formRef}
      action={basePath}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-7"
    >
      {state.q && <input type="hidden" name="q" value={state.q} />}
      {state.sort && <input type="hidden" name="sort" value={state.sort} />}

      {facets.categories && facets.categories.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-lg font-semibold">Category</legend>
          <select
            name="category"
            defaultValue={state.category ?? ""}
            onChange={onChange}
            className="h-12 w-full rounded-xl border-2 border-input bg-background px-3 text-base"
            aria-label="Category"
          >
            <option value="">All categories</option>
            {facets.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-1 text-lg font-semibold">Availability</legend>
        <Checkbox name="stock" value="1" label="In stock only" defaultChecked={state.inStock} onChange={onChange} />
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-lg font-semibold">Price ({currency})</legend>
        <div className="flex items-end gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-sm font-medium">From</span>
            <input
              type="number"
              inputMode="numeric"
              name="min"
              min={0}
              defaultValue={state.min ?? ""}
              placeholder={String(facets.minPrice)}
              className="h-12 w-full rounded-xl border-2 border-input bg-background px-3 text-base"
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-sm font-medium">To</span>
            <input
              type="number"
              inputMode="numeric"
              name="max"
              min={0}
              defaultValue={state.max ?? ""}
              placeholder={String(facets.maxPrice)}
              className="h-12 w-full rounded-xl border-2 border-input bg-background px-3 text-base"
            />
          </label>
        </div>
      </fieldset>

      {facets.brands.length > 0 && (
        <fieldset>
          <legend className="mb-1 text-lg font-semibold">Brand</legend>
          <div className="max-h-72 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <Checkbox key={b.value} name="brand" value={b.value} label={b.value} count={b.count} defaultChecked={state.brands.includes(b.value)} onChange={onChange} />
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-2">
        <button type="submit" className="h-12 rounded-xl bg-foreground font-semibold text-background hover:opacity-90">
          Apply filters
        </button>
        <button
          type="button"
          onClick={() => router.push(state.q ? `${basePath}?q=${encodeURIComponent(state.q)}` : basePath, { scroll: false })}
          className="h-12 rounded-xl border-2 border-input font-semibold hover:bg-muted"
        >
          Clear all filters
        </button>
      </div>
    </form>
  );
}

export function ListingFilters(props: { state: FilterState; facets: Facets; basePath: string; activeCount: number }) {
  const [open, setOpen] = useState(false);
  // Remount the forms when filters change so default values stay in sync with the URL.
  const formKey = JSON.stringify(props.state);
  return (
    <>
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-input px-4 font-semibold">
              <SlidersHorizontal className="size-5" aria-hidden />
              Filters{props.activeCount > 0 && ` (${props.activeCount})`}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-sm overflow-y-auto">
            <SheetHeader className="px-1">
              <SheetTitle className="text-xl">Filter products</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8" onSubmit={() => setOpen(false)}>
              <FilterFields key={formKey} state={props.state} facets={props.facets} basePath={props.basePath} autoSubmit={false} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <aside aria-label="Filters" className="hidden lg:block">
        <FilterFields key={formKey} state={props.state} facets={props.facets} basePath={props.basePath} autoSubmit />
      </aside>
    </>
  );
}

export function SortSelect({ value, options }: { value: string; options: readonly { value: string; label: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2">
      <span className="font-medium whitespace-nowrap">Sort by</span>
      <select
        value={value}
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set("sort", e.target.value);
          url.searchParams.delete("page");
          router.push(url.pathname + url.search, { scroll: false });
        }}
        className="h-12 rounded-xl border-2 border-input bg-background px-3 text-base"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
