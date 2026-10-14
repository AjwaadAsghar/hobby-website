import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banknote, MessageCircle, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, getRelatedProducts, skillLabel } from "@/server/catalog";
import { getSettings, siteUrl } from "@/lib/settings";
import { sanitizeRichText } from "@/lib/sanitize";
import { whatsappLink } from "@/lib/format";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchase } from "@/components/store/product-purchase";
import { ProductGrid } from "@/components/store/product-card";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const description = p.shortDescription || `${p.title} by ${p.brand}`;
  return {
    title: p.title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.title, description, type: "website" },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const [p, s] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!p) notFound();
  const related = await getRelatedProducts(p.id, p.categoryId, 4);
  const specs = Object.entries(p.specsObj).filter(([k, v]) => k && v);
  const url = `${siteUrl()}/product/${p.slug}`;
  const minPrice = p.variantList.length ? Math.min(...p.variantList.map((v) => v.price)) : p.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.shortDescription,
    sku: p.sku ?? undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    image: p.images.map((i) => (i.url.startsWith("http") ? i.url : `${siteUrl()}${i.url}`)),
    category: p.category?.name,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: s.commerce.currency,
      price: (minPrice / 100).toFixed(2),
      availability: p.stockTotal > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: s.branding.storeName },
    },
  };

  return (
    <div className="container-store py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(p.category ? [{ label: p.category.name, href: `/category/${p.category.slug}` }] : [{ label: "Shop", href: "/shop" }]),
          { label: p.title },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={p.images.map((i) => ({ url: i.url, alt: i.alt || p.title }))} title={p.title} modelUrl={p.modelUrl} />

        <div>
          <div className="flex flex-wrap items-center gap-2 text-[0.95rem]">
            {p.brand && <span className="font-semibold">{p.brand}</span>}
            <span className="rounded-full bg-muted px-3 py-1 font-semibold">{skillLabel(p.skillLevel)} level</span>
            {p.sku && <span className="text-muted-foreground">SKU: {p.sku}</span>}
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{p.title}</h1>
          {p.shortDescription && <p className="mt-4 text-lg text-muted-foreground">{p.shortDescription}</p>}

          <div className="mt-6">
            <ProductPurchase
              product={{
                id: p.id,
                slug: p.slug,
                title: p.title,
                image: p.images[0]?.url ?? null,
                price: p.price,
                compareAtPrice: p.compareAtPrice,
                stock: Math.max(0, p.stock),
                lowStockThreshold: p.lowStockThreshold,
              }}
              variants={p.variantList}
            />
          </div>

          <ul className="mt-8 grid gap-3 rounded-2xl border p-5 sm:grid-cols-2">
            <li className="flex items-center gap-3">
              <Truck className="size-6 shrink-0 text-brand" aria-hidden /> Delivery in 2–4 working days
            </li>
            <li className="flex items-center gap-3">
              <Banknote className="size-6 shrink-0 text-brand" aria-hidden /> Cash on delivery available
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-6 shrink-0 text-brand" aria-hidden /> 100% genuine product
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw className="size-6 shrink-0 text-brand" aria-hidden /> 7-day easy returns
            </li>
          </ul>

          {s.contact.whatsapp && (
            <a
              href={whatsappLink(s.contact.whatsapp, `Hi, I have a question about "${p.title}" (${url})`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-12 items-center gap-2 rounded-xl border-2 border-input px-5 font-semibold hover:bg-muted"
            >
              <MessageCircle className="size-5" aria-hidden /> Ask a question on WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="desc-heading">
          <h2 id="desc-heading" className="text-2xl font-bold sm:text-3xl">
            Description
          </h2>
          <div className="prose-store mt-4 text-lg" dangerouslySetInnerHTML={{ __html: sanitizeRichText(p.description) }} />
        </section>
        <div className="space-y-12">
          {specs.length > 0 && (
            <section aria-labelledby="specs-heading">
              <h2 id="specs-heading" className="text-2xl font-bold sm:text-3xl">
                Specifications
              </h2>
              <table className="mt-4 w-full overflow-hidden rounded-2xl border text-left">
                <tbody>
                  {specs.map(([k, v], i) => (
                    <tr key={k} className={i % 2 ? "" : "bg-muted/60"}>
                      <th scope="row" className="w-2/5 px-4 py-3 align-top font-semibold">
                        {k}
                      </th>
                      <td className="px-4 py-3">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {p.inTheBoxList.length > 0 && (
            <section aria-labelledby="box-heading">
              <h2 id="box-heading" className="text-2xl font-bold sm:text-3xl">
                What&apos;s in the box
              </h2>
              <ul className="mt-4 space-y-2 text-lg">
                {p.inTheBoxList.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {p.compatible.length > 0 && (
        <section className="mt-20" aria-labelledby="compat-heading">
          <h2 id="compat-heading" className="mb-6 text-2xl font-bold sm:text-3xl">
            Compatible parts &amp; accessories
          </h2>
          <ProductGrid products={p.compatible} />
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6 text-2xl font-bold sm:text-3xl">
            You may also like
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
