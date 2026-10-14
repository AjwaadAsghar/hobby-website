import Link from "next/link";
import { Search } from "lucide-react";
import { db, containsText } from "@/lib/db";
import { PageHeader } from "@/components/admin/admin-shell";
import { InventoryTable, type InvRow } from "./inventory-table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const filter = typeof sp.filter === "string" ? sp.filter : "all";
  const products = await db.product.findMany({
    where: q ? { OR: [{ title: containsText(q) }, { sku: containsText(q) }, { variants: { some: { sku: containsText(q) } } }] } : {},
    orderBy: { title: "asc" },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });

  let rows: InvRow[] = products.flatMap<InvRow>((p) =>
    p.variants.length
      ? p.variants.map((v, i) => ({
          key: `v-${v.id}`,
          kind: "variant" as const,
          id: v.id,
          productId: p.id,
          title: p.title,
          variant: v.name,
          sku: v.sku,
          stock: v.stock,
          threshold: p.lowStockThreshold,
          showThreshold: i === 0,
        }))
      : [{ key: `p-${p.id}`, kind: "product" as const, id: p.id, productId: p.id, title: p.title, variant: null, sku: p.sku, stock: p.stock, threshold: p.lowStockThreshold, showThreshold: true }],
  );
  const counts = { all: rows.length, low: rows.filter((r) => r.stock > 0 && r.stock <= r.threshold).length, out: rows.filter((r) => r.stock === 0).length };
  if (filter === "low") rows = rows.filter((r) => r.stock <= r.threshold);
  if (filter === "out") rows = rows.filter((r) => r.stock === 0);

  const tabs = [
    { v: "all", l: `All (${counts.all})` },
    { v: "low", l: `Low or out (${counts.low + counts.out})` },
    { v: "out", l: `Sold out (${counts.out})` },
  ];

  return (
    <>
      <PageHeader title="Inventory" description="Update stock quickly. Stock goes down automatically when orders are placed and comes back if an order is cancelled." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <nav aria-label="Inventory filter" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.v}
              href={`/admin/inventory?filter=${t.v}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={filter === t.v ? "page" : undefined}
              className={cn("rounded-full border px-4 py-2 text-sm font-semibold", filter === t.v ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted")}
            >
              {t.l}
            </Link>
          ))}
        </nav>
        <form method="get" className="ml-auto flex gap-2">
          <input type="hidden" name="filter" value={filter} />
          <label className="relative">
            <span className="sr-only">Search inventory</span>
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input name="q" defaultValue={q} placeholder="Product or SKU" className="h-11 w-64 rounded-xl border-2 border-input bg-background pr-3 pl-9" />
          </label>
          <button className="h-11 rounded-xl bg-foreground px-4 font-semibold text-background">Search</button>
        </form>
      </div>
      <InventoryTable key={`${filter}-${q}`} rows={rows} />
    </>
  );
}
