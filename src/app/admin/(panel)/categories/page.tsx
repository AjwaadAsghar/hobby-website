import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/admin-shell";
import { Panel } from "@/components/admin/badges";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { ProductImage } from "@/components/store/product-image";
import { CategoryForm, type CategoryValues } from "./category-form";
import { deleteCategory } from "./actions";

export const metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const sp = await searchParams;
  const cats = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  const editing = typeof sp.edit === "string" ? cats.find((c) => c.id === sp.edit) : undefined;
  const initial: CategoryValues = editing
    ? { id: editing.id, name: editing.name, slug: editing.slug, description: editing.description, image: editing.image ?? "", sortOrder: String(editing.sortOrder), isActive: editing.isActive }
    : { name: "", slug: "", description: "", image: "", sortOrder: String(cats.length), isActive: true };

  return (
    <>
      <PageHeader title="Categories" description="The category names shown in the store menu." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ul className="divide-y rounded-2xl border bg-card shadow-sm">
          {cats.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                <ProductImage src={c.image} alt="" sizes="56px" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {c.name} {!c.isActive && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">Hidden</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  /category/{c.slug} · {c._count.products} product{c._count.products === 1 ? "" : "s"}
                </p>
              </div>
              <Link href={`/admin/categories?edit=${c.id}`} className="inline-flex h-10 items-center rounded-lg border-2 border-input px-3 text-sm font-semibold hover:bg-muted">
                Edit
              </Link>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmSubmit message={`Delete “${c.name}”? Its ${c._count.products} product(s) will be kept but have no category.`} className="h-10 rounded-lg px-3 text-sm font-semibold text-destructive hover:bg-destructive/5">
                  Delete
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
        <Panel title={editing ? `Edit ${editing.name}` : "Add category"} action={editing && <Link href="/admin/categories" className="text-sm font-semibold underline">Cancel</Link>}>
          <CategoryForm key={editing?.id ?? "new"} initial={initial} />
        </Panel>
      </div>
    </>
  );
}
