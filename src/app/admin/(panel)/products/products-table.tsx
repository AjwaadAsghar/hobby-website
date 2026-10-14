"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import { bulkProducts, importProductsCsv, type ImportResult } from "./actions";
import { ProductImage } from "@/components/store/product-image";
import { useMoney } from "@/components/store-context";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  image: string | null;
  sku: string | null;
  brand: string;
  category: string | null;
  price: number;
  stock: number;
  low: boolean;
  status: string;
  featured: boolean;
  variants: number;
};

export function ProductsTable({ rows }: { rows: Row[] }) {
  const money = useMoney();
  const [selected, setSelected] = useState<string[]>([]);
  const all = rows.length > 0 && selected.length === rows.length;
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <form action={bulkProducts}>
      {selected.map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}
      <div className={cn("mb-3 flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3", !selected.length && "opacity-60")}>
        <span className="px-1 font-semibold">{selected.length} selected</span>
        {[
          ["publish", "Publish"],
          ["draft", "Set to draft"],
          ["feature", "Feature"],
          ["unfeature", "Un-feature"],
        ].map(([v, l]) => (
          <button key={v} name="bulk" value={v} disabled={!selected.length} className="h-10 rounded-xl border-2 border-input bg-background px-3 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed">
            {l}
          </button>
        ))}
        <button
          name="bulk"
          value="delete"
          disabled={!selected.length}
          onClick={(e) => {
            if (!confirm(`Delete ${selected.length} product(s)? This cannot be undone. Past orders keep their details.`)) e.preventDefault();
          }}
          className="h-10 rounded-xl border-2 border-destructive/50 px-3 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:cursor-not-allowed"
        >
          Delete
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[820px] text-left">
          <thead className="border-b bg-muted/50 text-sm">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all products on this page"
                  checked={all}
                  onChange={() => setSelected(all ? [] : rows.map((r) => r.id))}
                  className="size-5 accent-[var(--brand)]"
                />
              </th>
              <th className="py-3 font-semibold">Product</th>
              <th className="px-3 py-3 font-semibold">Category</th>
              <th className="px-3 py-3 font-semibold">Price</th>
              <th className="px-3 py-3 font-semibold">Stock</th>
              <th className="px-3 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className={cn("border-b last:border-0 hover:bg-muted/40", selected.includes(r.id) && "bg-brand-soft/50")}>
                <td className="px-4 py-3">
                  <input type="checkbox" aria-label={`Select ${r.title}`} checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="size-5 accent-[var(--brand)]" />
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <ProductImage src={r.image} alt="" sizes="48px" />
                    </span>
                    <div className="min-w-0">
                      <Link href={`/admin/products/${r.id}`} className="font-semibold hover:underline">
                        {r.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {[r.brand, r.sku, r.variants ? `${r.variants} variants` : null, r.featured ? "★ Featured" : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-sm">{r.category ?? "-"}</td>
                <td className="px-3 py-3 tabular-nums">{money(r.price)}</td>
                <td className={cn("px-3 py-3 font-semibold tabular-nums", r.stock === 0 ? "text-destructive" : r.low && "text-warning")}>{r.stock}</td>
                <td className="px-3 py-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-semibold", r.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200")}>
                    {r.status === "PUBLISHED" ? "Published" : "Draft"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}

export function ImportDialog() {
  const [state, action, pending] = useActionState<ImportResult, FormData>(importProductsCsv, {});
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
          <Upload className="size-4" aria-hidden /> Import CSV
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import products from CSV</DialogTitle>
          <DialogDescription>
            Use the same columns as “Export CSV”. Products are matched by SKU, then by slug - matches are updated, new rows are created. Variants are not imported; add them in the product editor.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="file" name="file" accept=".csv,text/csv" required className="block w-full rounded-xl border-2 border-input p-3" />
          <button disabled={pending} className="h-11 w-full rounded-xl bg-foreground font-semibold text-background disabled:opacity-50">
            {pending ? "Importing…" : "Import"}
          </button>
        </form>
        {state.ok && (
          <p role="status" className="rounded-xl bg-success/10 p-3 font-medium text-success">
            Done: {state.created} created, {state.updated} updated.
          </p>
        )}
        {state.errors && state.errors.length > 0 && (
          <ul role="alert" className="max-h-48 list-disc overflow-y-auto rounded-xl bg-destructive/5 p-3 pl-7 text-sm text-destructive">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
