import { getProductBySlug } from "@/server/catalog";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { ogCard, OG_SIZE } from "@/lib/og";

export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Product preview";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, s] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!p) return ogCard({ storeName: s.branding.storeName, accent: s.branding.accentColor, title: s.homepage.heroTitle });
  const price = p.variantList.length ? Math.min(...p.variantList.map((v) => v.price)) : p.price;
  return ogCard({
    storeName: s.branding.storeName,
    accent: s.branding.accentColor,
    title: p.title,
    subtitle: p.shortDescription,
    price: formatMoney(price, { currency: s.commerce.currency, locale: s.commerce.locale }),
    badge: p.compareAtPrice && p.compareAtPrice > price ? `Save ${Math.round((1 - price / p.compareAtPrice) * 100)}%` : p.brand || undefined,
    image: p.images[0]?.url,
  });
}
