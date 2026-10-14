import { db } from "@/lib/db";
import { AuthError, requireAdmin } from "@/lib/auth-helpers";
import { toCsv } from "@/lib/csv";
import { parseJson } from "@/lib/json";

/** Product CSV export. The same columns are accepted by the CSV import. */
export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return new Response(e.message, { status: e.status });
    throw e;
  }
  const products = await db.product.findMany({
    orderBy: { createdAt: "asc" },
    include: { category: true, images: { orderBy: { sortOrder: "asc" } }, variants: true },
  });
  const header = [
    "title", "slug", "sku", "brand", "category", "price", "compare_at_price", "cost_price", "stock", "low_stock_threshold",
    "skill_level", "status", "featured", "short_description", "description", "tags", "image_urls", "specs", "in_the_box", "variants",
  ];
  const rows = products.map((p) => [
    p.title,
    p.slug,
    p.sku ?? "",
    p.brand,
    p.category?.slug ?? "",
    p.price / 100,
    p.compareAtPrice ? p.compareAtPrice / 100 : "",
    p.costPrice !== null ? p.costPrice / 100 : "",
    p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock,
    p.lowStockThreshold,
    p.skillLevel,
    p.status,
    p.featured ? "yes" : "no",
    p.shortDescription,
    p.description,
    p.tags,
    p.images.map((i) => i.url).join(" | "),
    Object.entries(parseJson<Record<string, string>>(p.specs, {}))
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | "),
    parseJson<string[]>(p.inTheBox, []).join(" | "),
    p.variants.map((v) => `${v.name} (stock ${v.stock})`).join(" | "),
  ]);
  return new Response(toCsv([header, ...rows]), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
