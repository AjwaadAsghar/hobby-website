import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/admin-shell";
import { ProductForm } from "../product-form";
import { loadFormContext, productToForm } from "../form-data";
import { deleteProduct, duplicateProduct } from "../actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

// Saving a product (photos, variants, compatible parts) gets more time than the default.
export const maxDuration = 60;

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [initial, ctx] = await Promise.all([productToForm(id), loadFormContext()]);
  if (!initial) notFound();
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All products
      </Link>
      {(sp.created || sp.duplicated) && (
        <p role="status" className="mb-4 rounded-2xl bg-success/10 p-3 font-medium text-success">
          {sp.created ? "Product created." : "Copy created as a draft with 0 stock. Update the details and save."}
        </p>
      )}
      <PageHeader
        title={initial.title}
        actions={
          <>
            <form action={duplicateProduct}>
              <input type="hidden" name="id" value={id} />
              <button className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
                <Copy className="size-4" aria-hidden /> Duplicate
              </button>
            </form>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={id} />
              <ConfirmSubmit message="Delete this product? This cannot be undone. Past orders keep their details." className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-destructive/50 px-4 font-semibold text-destructive hover:bg-destructive/5">
                <Trash2 className="size-4" aria-hidden /> Delete
              </ConfirmSubmit>
            </form>
          </>
        }
      />
      <ProductForm key={id} initial={initial} categories={ctx.categories} allProducts={ctx.allProducts} />
    </>
  );
}
