import "server-only";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { getSettings } from "@/lib/settings";
import type { ProductFormValues } from "./product-form";

const major = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n / 100));

export async function loadFormContext() {
  const [categories, allProducts] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  return { categories, allProducts };
}

export async function emptyProduct(): Promise<ProductFormValues> {
  const s = await getSettings();
  return {
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    sku: "",
    brand: "",
    categoryId: "",
    skillLevel: "BEGINNER",
    status: "PUBLISHED",
    featured: false,
    stock: "0",
    lowStockThreshold: String(s.commerce.lowStockDefault),
    specs: [
      { key: "Scale", value: "" },
      { key: "Motor", value: "" },
      { key: "Battery", value: "" },
      { key: "Range", value: "" },
      { key: "Run time", value: "" },
    ],
    inTheBox: [],
    tags: "",
    images: [],
    modelUrl: "",
    optionNames: [],
    variants: [],
    compatibleIds: [],
  };
}

export async function productToForm(id: string): Promise<ProductFormValues | null> {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      compatibleWith: { select: { id: true } },
      compatibleParts: { select: { id: true } },
    },
  });
  if (!p) return null;
  const variants = p.variants.map((v) => ({ id: v.id, options: parseJson<Record<string, string>>(v.options, {}), sku: v.sku ?? "", price: major(v.price), stock: String(v.stock) }));
  const optionNames = [...new Set(variants.flatMap((v) => Object.keys(v.options)))].slice(0, 3);
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDescription: p.shortDescription,
    description: p.description,
    price: major(p.price),
    compareAtPrice: major(p.compareAtPrice),
    costPrice: major(p.costPrice),
    sku: p.sku ?? "",
    brand: p.brand,
    categoryId: p.categoryId ?? "",
    skillLevel: p.skillLevel as ProductFormValues["skillLevel"],
    status: p.status as ProductFormValues["status"],
    featured: p.featured,
    stock: String(p.stock),
    lowStockThreshold: String(p.lowStockThreshold),
    specs: Object.entries(parseJson<Record<string, string>>(p.specs, {})).map(([key, value]) => ({ key, value })),
    inTheBox: parseJson<string[]>(p.inTheBox, []),
    tags: p.tags,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    modelUrl: p.modelUrl ?? "",
    optionNames: optionNames.length ? optionNames : variants.length ? ["Option"] : [],
    variants,
    compatibleIds: [...new Set([...p.compatibleWith, ...p.compatibleParts].map((x) => x.id))],
  };
}
