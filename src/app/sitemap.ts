import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/settings";
import { defaultPages } from "@/config/default-pages";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true, images: { select: { url: true }, take: 1 } } }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const abs = (u: string) => (u.startsWith("http") ? u : `${base}${u}`);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images.map((i) => abs(i.url)),
    })),
    ...Object.keys(defaultPages).map((slug) => ({ url: `${base}/${slug}`, changeFrequency: "monthly" as const, priority: 0.4 })),
    { url: `${base}/track`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
