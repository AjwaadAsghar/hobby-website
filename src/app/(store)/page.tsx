import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Banknote, Headset, ShieldCheck, Star, Truck } from "lucide-react";
import { getSettings, siteUrl } from "@/lib/settings";
import { getActiveCategories, getBestSellers, getFeaturedProducts, getNewArrivals } from "@/server/catalog";
import { HeroPlanes } from "@/components/store/hero-planes";
import { ProductGrid } from "@/components/store/product-card";
import { CategoryTile } from "@/components/store/category-tile";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { Reveal } from "@/components/motion/reveal";
import { ProductImage } from "@/components/store/product-image";
import { Button } from "@/components/ui/button";

const badgeIcons = [Truck, Banknote, ShieldCheck, Headset];

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 font-semibold tracking-wide text-brand-text uppercase">{eyebrow}</p>}
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-2 rounded-full border-2 border-foreground px-5 py-2.5 font-semibold transition hover:bg-foreground hover:text-background">
          {linkLabel ?? "View all"} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

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
  const [categories, featured, newArrivals, bestSellers] = await Promise.all([
    getActiveCategories(),
    getFeaturedProducts(s.homepage.featuredProductIds, 8),
    getNewArrivals(4),
    getBestSellers(4),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(s)).replace(/</g, "\\u003c") }} />
      {/* Hero: text only, with two planes flying out of the corners on load. */}
      <section className="relative isolate overflow-hidden bg-[#09090b] text-white" aria-labelledby="hero-title">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,color-mix(in_oklch,var(--brand)_22%,transparent),transparent_70%)]"
        />
        <HeroPlanes />

        <div className="container-store relative z-10 flex flex-col items-center py-20 text-center sm:py-24 lg:py-32">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[0.95rem] font-semibold text-zinc-100">
            <span className="size-2 rounded-full bg-brand" aria-hidden /> {s.branding.tagline}
          </p>
          <h1 id="hero-title" className="mt-6 max-w-4xl text-[2.6rem] leading-[1.04] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {s.homepage.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-pretty text-zinc-300 sm:text-xl">{s.homepage.heroSubtitle}</p>
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" variant="brand">
              <Link href={s.homepage.heroCtaHref || "/shop"}>
                {s.homepage.heroCtaLabel || "Shop now"} <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white/80 bg-transparent text-white hover:bg-white hover:text-zinc-950">
              <Link href="/shop?sort=price-asc">Lowest prices first</Link>
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

      {/* Categories */}
      <section className="container-store py-16 sm:py-20" aria-labelledby="shop-by-category">
        <Reveal>
          <div className="mb-8">
            <p className="mb-2 font-semibold tracking-wide text-brand-text uppercase">Browse</p>
            <h2 id="shop-by-category" className="text-3xl font-bold sm:text-4xl">
              Shop by category
            </h2>
          </div>
        </Reveal>
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-3">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Reveal delay={Math.min(i, 5) * 0.05}>
                <CategoryTile name={c.name} slug={c.slug} image={c.image} count={c._count.products} />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-store py-8" aria-label="Featured products">
          <Reveal>
            <SectionHeading eyebrow="Hand-picked" title="Featured products" href="/shop" linkLabel="Shop all" />
          </Reveal>
          <ProductGrid products={featured} />
        </section>
      )}

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

      {/* Skill level guide */}
      <section className="container-store py-16" aria-labelledby="skill-guide">
        <div className="rounded-[2rem] bg-zinc-950 px-6 py-12 text-white sm:px-12">
          <Reveal>
            <p className="mb-2 font-semibold tracking-wide text-white/80 uppercase">Not sure where to start?</p>
            <h2 id="skill-guide" className="max-w-2xl text-3xl font-bold sm:text-4xl">
              Pick your experience level and we will show you the right models
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { value: "BEGINNER", title: "Beginner", text: "Ready to run, easy to control, tough enough to survive a few crashes." },
              { value: "INTERMEDIATE", title: "Intermediate", text: "More speed and more control once you know the basics." },
              { value: "EXPERT", title: "Expert", text: "Kits, FPV and full-power machines for experienced hobbyists." },
            ].map((l, i) => (
              <li key={l.value}>
                <Reveal delay={i * 0.08}>
                  <Link href={`/shop?skill=${l.value}`} className="group flex h-full flex-col rounded-2xl border border-white/15 bg-white/5 p-6 transition hover:border-white/40 hover:bg-white/10">
                    <span className="text-2xl font-bold">{l.title}</span>
                    <span className="mt-2 text-white/85">{l.text}</span>
                    <span className="mt-6 inline-flex items-center gap-2 font-semibold">
                      Show {l.title.toLowerCase()} models <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="container-store py-8" aria-label="New arrivals">
          <Reveal>
            <SectionHeading eyebrow="Just landed" title="New arrivals" href="/shop?sort=newest" />
          </Reveal>
          <ProductGrid products={newArrivals} />
        </section>
      )}

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="container-store py-16" aria-label="Best sellers">
          <Reveal>
            <SectionHeading eyebrow="Customer favourites" title="Best sellers" href="/shop?sort=best-selling" />
          </Reveal>
          <ProductGrid products={bestSellers} />
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
