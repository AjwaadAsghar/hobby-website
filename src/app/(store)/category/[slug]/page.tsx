import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseListingParams } from "@/server/catalog";
import { ProductListing } from "@/components/store/product-listing";

async function getCategory(slug: string) {
  return db.category.findFirst({ where: { slug, isActive: true } });
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: "Category not found" };
  return {
    title: cat.name,
    description: cat.description || `Shop ${cat.name}`,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: { title: cat.name, description: cat.description, images: cat.image && !cat.image.endsWith(".svg") ? [cat.image] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const filters = { ...parseListingParams(sp), category: cat.slug };
  return (
    <ProductListing filters={filters} searchParams={sp} basePath={`/category/${cat.slug}`} title={cat.name} description={cat.description} />
  );
}
