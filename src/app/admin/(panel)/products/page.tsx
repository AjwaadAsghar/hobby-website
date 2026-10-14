import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Download, Plus, Search } from "lucide-react";
import { db, containsText } from "@/lib/db";
import { PageHeader } from "@/components/admin/admin-shell";
import { ImportDialog, ProductsTable } from "./products-table";

export const metadata = { title: "Products" };
const PAGE_SIZE = 30;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  const q = one(sp.q);
  const status = one(sp.status);
  const category = one(sp.category);
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ title: containsText(q) }, { sku: containsText(q) }, { brand: containsText(q) }, { variants: { some: { sku: containsText(q) } } }] } : {}),
    ...(status ? { status } : {}),
    ...(category ? { categoryId: category } : {}),
  };
  const [total, products, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true, variants: { select: { stock: true } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (category) u.set("category", category);
    if (p > 1) u.set("page", String(p));
    return `/admin/products?${u}`;
  };

  return (
    <>
      {sp.deleted && <p role="status" className="mb-4 rounded-2xl bg-success/10 p-3 font-medium text-success">Product deleted.</p>}
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}`}
        actions={
          <>
            <ImportDialog />
            <a href="/api/admin/products/export" className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
            <Link href="/admin/products/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-brand-foreground hover:brightness-110">
              <Plus className="size-5" aria-hidden /> Add product
            </Link>
          </>
        }
      />
      <form method="get" className="mb-4 grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
        <label className="relative">
          <span className="sr-only">Search products</span>
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Name, SKU or brand" className="h-11 w-full rounded-xl border-2 border-input bg-background pr-3 pl-9" />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status ?? ""} className="h-11 w-full rounded-xl border-2 border-input bg-background px-3">
            <option value="">Any status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select name="category" defaultValue={category ?? ""} className="h-11 w-full rounded-xl border-2 border-input bg-background px-3">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="h-11 rounded-xl bg-foreground px-5 font-semibold text-background">Filter</button>
      </form>

      <ProductsTable
        rows={products.map((p) => {
          const stock = p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;
          return {
            id: p.id,
            title: p.title,
            image: p.images[0]?.url ?? null,
            sku: p.sku,
            brand: p.brand,
            category: p.category?.name ?? null,
            price: p.price,
            stock,
            low: stock <= p.lowStockThreshold,
            status: p.status,
            featured: p.featured,
            variants: p.variants.length,
          };
        })}
      />

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={link(page - 1)} className="inline-flex h-11 items-center rounded-xl border-2 border-input bg-background px-4 font-semibold">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={link(page + 1)} className="inline-flex h-11 items-center rounded-xl border-2 border-input bg-background px-4 font-semibold">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
