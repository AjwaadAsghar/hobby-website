import "server-only";
import { cache } from "react";
import Fuse from "fuse.js";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";

export const SKILL_LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "EXPERT", label: "Expert" },
] as const;

export function skillLabel(v: string) {
  return SKILL_LEVELS.find((s) => s.value === v)?.label ?? v;
}

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "best-selling", label: "Best selling" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
] as const;

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 2 },
  variants: { select: { id: true, stock: true, price: true }, orderBy: { sortOrder: "asc" } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  imageAlt: string;
  hoverImage: string | null;
  stock: number;
  lowStock: boolean;
  skillLevel: string;
  categoryName: string | null;
  hasVariants: boolean;
  /** For one-click add-to-cart when the product has no variants */
  quickAdd: boolean;
};

export function totalStock(p: { stock: number; variants: { stock: number }[] }) {
  return p.variants.length ? p.variants.reduce((s, v) => s + Math.max(0, v.stock), 0) : Math.max(0, p.stock);
}

export function toCard(p: CardRow): ProductCardData {
  const stock = totalStock(p);
  const minVariantPrice = p.variants.length
    ? Math.min(...p.variants.map((v) => v.price ?? p.price))
    : p.price;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    price: minVariantPrice,
    compareAtPrice: p.compareAtPrice && p.compareAtPrice > minVariantPrice ? p.compareAtPrice : null,
    image: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.alt || p.title,
    hoverImage: p.images[1]?.url ?? null,
    stock,
    lowStock: stock > 0 && stock <= p.lowStockThreshold,
    skillLevel: p.skillLevel,
    categoryName: p.category?.name ?? null,
    hasVariants: p.variants.length > 0,
    quickAdd: p.variants.length === 0 && stock > 0,
  };
}

export const getActiveCategories = cache(async () => {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { status: "PUBLISHED" } } } } },
  });
});

const published: Prisma.ProductWhereInput = { status: "PUBLISHED" };

export async function getFeaturedProducts(ids: string[], take = 8) {
  if (ids.length) {
    const rows = await db.product.findMany({ where: { ...published, id: { in: ids } }, include: cardInclude });
    return ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean).map((r) => toCard(r!));
  }
  const rows = await db.product.findMany({
    where: { ...published, featured: true },
    include: cardInclude,
    orderBy: { updatedAt: "desc" },
    take,
  });
  return rows.map(toCard);
}

export async function getNewArrivals(take = 8) {
  const rows = await db.product.findMany({ where: published, include: cardInclude, orderBy: { createdAt: "desc" }, take });
  return rows.map(toCard);
}

export async function getBestSellers(take = 8) {
  const rows = await db.product.findMany({ where: published, include: cardInclude, orderBy: { soldCount: "desc" }, take });
  return rows.map(toCard);
}

export type ListingFilters = {
  category?: string;
  q?: string;
  brands?: string[];
  skills?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export function parseListingParams(sp: Record<string, string | string[] | undefined>): ListingFilters {
  const arr = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);
  const num = (v: string | string[] | undefined) => {
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  return {
    category: str(sp.category),
    q: str(sp.q)?.slice(0, 100),
    brands: arr(sp.brand),
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    inStock: str(sp.stock) === "1",
    sort: str(sp.sort),
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
  };
}

const sortOrders: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ featured: "desc" }, { soldCount: "desc" }, { createdAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  "best-selling": [{ soldCount: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  name: [{ title: "asc" }],
};

export async function listProducts(f: ListingFilters) {
  const pageSize = f.pageSize ?? 12;
  const page = f.page ?? 1;
  const where: Prisma.ProductWhereInput = { ...published };
  const and: Prisma.ProductWhereInput[] = [];

  if (f.category) and.push({ category: { slug: f.category } });
  if (f.brands?.length) and.push({ brand: { in: f.brands } });
  if (f.skills?.length) and.push({ skillLevel: { in: f.skills } });
  if (f.minPrice) and.push({ price: { gte: Math.round(f.minPrice * 100) } });
  if (f.maxPrice) and.push({ price: { lte: Math.round(f.maxPrice * 100) } });
  if (f.inStock) and.push({ OR: [{ stock: { gt: 0 } }, { variants: { some: { stock: { gt: 0 } } } }] });

  let searchIds: string[] | null = null;
  if (f.q) {
    searchIds = await searchProductIds(f.q, 200);
    and.push({ id: { in: searchIds } });
  }
  if (and.length) where.AND = and;

  const useSearchOrder = !!searchIds && (!f.sort || f.sort === "relevance");
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: cardInclude,
      orderBy: useSearchOrder ? undefined : sortOrders[f.sort ?? "featured"] ?? sortOrders.featured,
      skip: useSearchOrder ? undefined : (page - 1) * pageSize,
      take: useSearchOrder ? undefined : pageSize,
    }),
  ]);

  let pageRows = rows;
  if (useSearchOrder && searchIds) {
    const rank = new Map(searchIds.map((id, i) => [id, i]));
    pageRows = [...rows].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0)).slice((page - 1) * pageSize, page * pageSize);
  }

  return {
    products: pageRows.map(toCard),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getFacetOptions(categorySlug?: string) {
  const where: Prisma.ProductWhereInput = { ...published, ...(categorySlug ? { category: { slug: categorySlug } } : {}) };
  const [brands, agg] = await Promise.all([
    db.product.groupBy({ by: ["brand"], where, _count: { _all: true }, orderBy: { brand: "asc" } }),
    db.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
  ]);
  return {
    brands: brands.filter((b) => b.brand).map((b) => ({ value: b.brand, count: b._count._all })),
    minPrice: Math.floor((agg._min.price ?? 0) / 100),
    maxPrice: Math.ceil((agg._max.price ?? 0) / 100),
  };
}

// ---------------------------------------------------------------------------
// Typo-tolerant search (Fuse.js over the published catalogue)
// ---------------------------------------------------------------------------

type SearchDoc = { id: string; title: string; brand: string; tags: string; category: string; short: string; sku: string };

const getSearchIndex = cache(async () => {
  const rows = await db.product.findMany({
    where: published,
    select: { id: true, title: true, brand: true, tags: true, shortDescription: true, sku: true, category: { select: { name: true } } },
  });
  const docs: SearchDoc[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    brand: r.brand,
    tags: r.tags,
    category: r.category?.name ?? "",
    short: r.shortDescription,
    sku: r.sku ?? "",
  }));
  return new Fuse(docs, {
    keys: [
      { name: "title", weight: 3 },
      { name: "brand", weight: 2 },
      { name: "category", weight: 1.5 },
      { name: "tags", weight: 1.5 },
      { name: "sku", weight: 1 },
      { name: "short", weight: 0.5 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  });
});

export async function searchProductIds(q: string, limit = 20): Promise<string[]> {
  const fuse = await getSearchIndex();
  const terms = q.trim();
  if (!terms) return [];
  return fuse.search(terms, { limit }).map((r) => r.item.id);
}

export async function searchSuggestions(q: string, limit = 6) {
  const ids = await searchProductIds(q, limit);
  if (!ids.length) return [];
  const rows = await db.product.findMany({ where: { id: { in: ids } }, include: cardInclude });
  return ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean).map((r) => toCard(r!));
}

// ---------------------------------------------------------------------------
// Product page
// ---------------------------------------------------------------------------

export async function getProductBySlug(slug: string) {
  const p = await db.product.findFirst({
    where: { slug, ...published },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      category: true,
      compatibleParts: { where: published, include: cardInclude, take: 8 },
      compatibleWith: { where: published, include: cardInclude, take: 8 },
    },
  });
  if (!p) return null;
  return {
    ...p,
    specsObj: parseJson<Record<string, string>>(p.specs, {}),
    inTheBoxList: parseJson<string[]>(p.inTheBox, []),
    variantList: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      options: parseJson<Record<string, string>>(v.options, {}),
      price: v.price ?? p.price,
      stock: Math.max(0, v.stock),
      sku: v.sku,
    })),
    stockTotal: totalStock(p),
    compatible: [...p.compatibleParts, ...p.compatibleWith]
      .filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i)
      .map(toCard),
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getRelatedProducts(productId: string, categoryId: string | null, take = 4) {
  const rows = await db.product.findMany({
    where: { ...published, id: { not: productId }, ...(categoryId ? { categoryId } : {}) },
    include: cardInclude,
    orderBy: { soldCount: "desc" },
    take,
  });
  return rows.map(toCard);
}
