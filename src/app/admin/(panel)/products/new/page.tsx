import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/admin-shell";
import { ProductForm } from "../product-form";
import { emptyProduct, loadFormContext } from "../form-data";

// Saving a product (photos, variants, compatible parts) gets more time than the default.
export const maxDuration = 60;

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const [initial, ctx] = await Promise.all([emptyProduct(), loadFormContext()]);
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All products
      </Link>
      <PageHeader title="Add product" />
      <ProductForm initial={initial} categories={ctx.categories} allProducts={ctx.allProducts} />
    </>
  );
}
