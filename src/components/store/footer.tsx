import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getActiveCategories } from "@/server/catalog";
import { telLink } from "@/lib/format";
import { Logo } from "@/components/store/logo";
import { SocialIcons } from "@/components/store/social-icons";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { getEnabledPaymentMethods } from "@/lib/payments/registry";

export async function Footer() {
  const [s, categories] = await Promise.all([getSettings(), getActiveCategories()]);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-zinc-950 text-zinc-100">
      <div className="container-store grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo name={s.branding.storeName} logoUrl={s.branding.logoUrl} invert />
          <p className="mt-4 max-w-sm text-zinc-300">{s.branding.tagline}</p>
          <ul className="mt-6 space-y-3 text-zinc-200">
            {s.contact.phone && (
              <li>
                <a href={telLink(s.contact.phone)} className="inline-flex items-center gap-3 hover:underline">
                  <Phone className="size-5 shrink-0" aria-hidden /> {s.contact.phone}
                </a>
              </li>
            )}
            {s.contact.email && (
              <li>
                <a href={`mailto:${s.contact.email}`} className="inline-flex items-center gap-3 break-all hover:underline">
                  <Mail className="size-5 shrink-0" aria-hidden /> {s.contact.email}
                </a>
              </li>
            )}
            {s.contact.address && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 size-5 shrink-0" aria-hidden /> <span>{s.contact.address}</span>
              </li>
            )}
          </ul>
          <SocialIcons links={s.contact.social} className="mt-6 flex gap-2" />
        </div>

        <nav aria-label="Shop" className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">Shop</h2>
          <ul className="mt-4 space-y-2.5 text-zinc-300">
            <li><Link href="/shop" className="hover:text-white hover:underline">All products</Link></li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="hover:text-white hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help" className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">Help</h2>
          <ul className="mt-4 space-y-2.5 text-zinc-300">
            {[
              ["/track", "Track my order"],
              ["/contact", "Contact us"],
              ["/faq", "FAQ"],
              ["/shipping-policy", "Shipping policy"],
              ["/returns-policy", "Returns policy"],
              ["/about", "About us"],
              ["/account", "My account"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-2 lg:col-span-4">
          <h2 className="text-lg font-semibold text-white">Get new arrivals and offers</h2>
          <p className="mt-2 mb-4 text-zinc-300">One short email a month. No spam, unsubscribe any time.</p>
          <NewsletterForm dark />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-store flex flex-col gap-2 py-6 text-[0.95rem] text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {s.branding.storeName}. All rights reserved.
          </p>
          <p>{getEnabledPaymentMethods(s).map((m) => m.label).join(" · ")}</p>
        </div>
      </div>
    </footer>
  );
}
