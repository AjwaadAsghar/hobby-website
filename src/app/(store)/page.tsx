import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Banknote, Headset, ShieldCheck, Star, Truck } from "lucide-react";
import { getSettings, siteUrl } from "@/lib/settings";
import { getActiveCategories } from "@/server/catalog";
import { HeroPlanes } from "@/components/store/hero-planes";
import { CategoryTile } from "@/components/store/category-tile";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { Reveal } from "@/components/motion/reveal";
import { ProductImage } from "@/components/store/product-image";
import { Button } from "@/components/ui/button";

const badgeIcons = [Truck, Banknote, ShieldCheck, Headset];

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** Organization + WebSite structured data (enables the sitelinks search box in Google). */
function homeJsonLd(s: Awaited<ReturnType<typeof getSettings>>) {
  const base = siteUrl();
  const logo = s.branding.logoUrl || "/api/brand/icon?size=512";
  return [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: s.branding.storeName,
      description: s.branding.tagline,
      url: base,
      logo: logo.startsWith("http") ? logo : `${base}${logo}`,
      email: s.contact.email || undefined,
      telephone: s.contact.phone || undefined,
      address: s.contact.address || undefined,
      sameAs: Object.values(s.contact.social).filter(Boolean),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: s.branding.storeName,
      url: base,
      potentialAction: { "@type": "SearchAction", target: `${base}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
  ];
}

export default async function HomePage() {
  const s = await getSettings();
  const categories = await getActiveCategories();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(s)).replace(/</g, "\\u003c") }} />
      {/* Hero: text only, with two planes flying out of the corners on load. */}
      <section className="relative isolate overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-[#09090b] dark:text-white" aria-labelledby="hero-title">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-50 dark:opacity-100 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,color-mix(in_oklch,var(--brand)_22%,transparent),transparent_70%)]"
        />
        <HeroPlanes />

        <div className="container-store relative z-10 flex flex-col items-center py-20 text-center sm:py-24 lg:py-32">
          <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[0.95rem] font-semibold text-zinc-800 dark:border-white/15 dark:bg-white/5 dark:text-zinc-100">
            <span className="size-2 rounded-full bg-brand" aria-hidden /> {s.branding.tagline}
          </p>
          <h1 id="hero-title" className="mt-6 max-w-4xl text-[2.6rem] leading-[1.04] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {s.homepage.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-pretty text-zinc-600 sm:text-xl dark:text-zinc-300">{s.homepage.heroSubtitle}</p>
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" variant="brand">
              <Link href={s.homepage.heroCtaHref || "/shop"}>
                {s.homepage.heroCtaLabel || "Shop now"} <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section aria-label="Why shop with us" className="border-b">
        <ul className="container-store grid grid-cols-1 gap-4 py-8 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {s.homepage.trustBadges.map((b, i) => {
            const Icon = badgeIcons[i % badgeIcons.length];
            return (
              <li key={b.title} className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-text">
                  <Icon className="size-7" aria-hidden />
                </span>
                <span>
                  <span className="block text-lg font-semibold">{b.title}</span>
                  <span className="block text-muted-foreground">{b.text}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Categories: the "Shop now" button scrolls here (#products). */}
      <section id="products" className="container-store scroll-mt-4 py-16 sm:py-20" aria-labelledby="shop-by-category">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="shop-by-category" className="text-3xl font-bold sm:text-4xl">
            Shop by category
          </h2>
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-full border-2 border-foreground px-5 py-2.5 font-semibold transition hover:bg-foreground hover:text-background">
            All products <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Reveal delay={Math.min(i, 5) * 0.05}>
                <CategoryTile name={c.name} slug={c.slug} image={c.image} count={c._count.products} />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Banners from settings */}
      {s.homepage.banners.length > 0 && (
        <section className="container-store grid gap-6 py-12 md:grid-cols-2" aria-label="Offers">
          {s.homepage.banners.map((b, i) => (
            <Reveal key={i}>
              <Link href={b.ctaHref || "/shop"} className="group relative flex min-h-72 flex-col justify-end overflow-hidden rounded-3xl bg-zinc-900 p-8 text-white">
                {b.image && (
                  <span className="absolute inset-0 opacity-70 transition duration-700 group-hover:scale-105">
                    <ProductImage src={b.image} alt="" sizes="(min-width: 768px) 50vw, 100vw" />
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" aria-hidden />
                <span className="relative">
                  <span className="block text-3xl font-bold">{b.title}</span>
                  {b.subtitle && <span className="mt-2 block text-lg text-white/90">{b.subtitle}</span>}
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-zinc-900">
                    {b.ctaLabel || "Shop now"} <ArrowRight className="size-4" aria-hidden />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </section>
      )}

      {/* Testimonials */}
      {s.homepage.testimonials.length > 0 && (
        <section className="border-y bg-muted/50 py-16 sm:py-20" aria-labelledby="testimonials">
          <div className="container-store">
            <Reveal>
              <h2 id="testimonials" className="text-3xl font-bold sm:text-4xl">
                What our customers say
              </h2>
            </Reveal>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {s.homepage.testimonials.map((t, i) => (
                <li key={i}>
                  <Reveal delay={i * 0.08} className="h-full">
                    <figure className="flex h-full flex-col rounded-3xl border bg-background p-7 shadow-sm">
                      <div className="flex gap-1 text-amber-500" aria-label={`${t.rating} out of 5 stars`} role="img">
                        {Array.from({ length: 5 }).map((_, k) => (
                          <Star key={k} className={`size-5 ${k < t.rating ? "fill-current" : "opacity-30"}`} aria-hidden />
                        ))}
                      </div>
                      <blockquote className="mt-4 flex-1 text-lg">“{t.text}”</blockquote>
                      <figcaption className="mt-5 font-semibold">
                        {t.name}
                        {t.location && <span className="font-normal text-muted-foreground"> · {t.location}</span>}
                      </figcaption>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container-store pt-16" aria-labelledby="newsletter-heading">
        <div className="grid items-center gap-8 rounded-[2rem] border bg-brand-soft p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 id="newsletter-heading" className="text-3xl font-bold">
              Be first to hear about new arrivals
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">Restocks, new models and members-only offers from {s.branding.storeName}.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
