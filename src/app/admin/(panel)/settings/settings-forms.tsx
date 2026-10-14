"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { StoreSettings } from "@/config/store";
import { saveSettings } from "./actions";
import { Card, TextField, Toggle, UploadField } from "@/components/admin/fields";
import { Logo } from "@/components/store/logo";

function useSaver<K extends keyof StoreSettings>(group: K) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = (data: unknown) =>
    start(async () => {
      const res = await saveSettings(group, data);
      if (res.ok) {
        setErrors({});
        toast.success("Saved. Changes are live on the store now.");
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error ?? "Could not save.");
      }
    });
  return { pending, errors, save };
}

function SaveBar({ pending }: { pending: boolean }) {
  return (
    <div className="sticky bottom-4 z-10 flex justify-end">
      <button disabled={pending} className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 font-semibold text-brand-foreground shadow-lg disabled:opacity-60">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Save changes
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function BrandingForm({ initial }: { initial: StoreSettings["branding"] }) {
  const [v, setV] = useState(initial);
  const { pending, errors, save } = useSaver("branding");
  const set = <K extends keyof typeof v>(k: K) => (val: (typeof v)[K]) => setV((x) => ({ ...x, [k]: val }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(v);
      }}
      className="space-y-6"
    >
      <Card title="Store name & logo" description="The name appears in the header, footer, page titles, emails, invoices and Telegram messages.">
        <TextField label="Store name" value={v.storeName} onChange={set("storeName")} error={errors.storeName} />
        <TextField label="Tagline" value={v.tagline} onChange={set("tagline")} hint="A short line shown under the logo and in search results." error={errors.tagline} />
        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Preview</p>
          <div style={{ ["--brand" as string]: v.accentColor }}>
            <Logo name={v.storeName || "Your store"} logoUrl={v.logoUrl} />
          </div>
        </div>
        <UploadField label="Logo" value={v.logoUrl} onChange={set("logoUrl")} folder="branding" hint="Optional. Without a logo, a clean text logo is made from the store name. PNG or SVG-like PNG, about 400×100 px." />
        <UploadField label="Favicon (browser tab icon)" value={v.faviconUrl} onChange={set("faviconUrl")} folder="branding" hint="Optional. A square image, at least 192×192 px. Without one, an icon with your initials is generated." />
      </Card>
      <Card title="Accent colour" description="Used sparingly for main buttons, prices on sale and highlights. Dark, strong colours keep text readable.">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-3">
            <span className="sr-only">Pick accent colour</span>
            <input type="color" value={v.accentColor} onChange={(e) => set("accentColor")(e.target.value)} className="h-12 w-16 cursor-pointer rounded-lg border-2 border-input bg-background" />
          </label>
          <input value={v.accentColor} onChange={(e) => set("accentColor")(e.target.value)} aria-label="Accent colour code" className="h-12 w-36 rounded-xl border-2 border-input bg-background px-3 font-mono" />
          {["#D7261E", "#C2410C", "#B91C1C", "#1D4ED8", "#047857", "#18181B"].map((c) => (
            <button key={c} type="button" onClick={() => set("accentColor")(c)} className="size-10 rounded-full border-2 border-white shadow ring-1 ring-black/10" style={{ background: c }} aria-label={`Use colour ${c}`} />
          ))}
        </div>
        {errors.accentColor && <p className="font-medium text-destructive">{errors.accentColor}</p>}
      </Card>
      <SaveBar pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------

export function ContactForm({ initial }: { initial: StoreSettings["contact"] }) {
  const [v, setV] = useState(initial);
  const { pending, errors, save } = useSaver("contact");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(v);
      }}
      className="space-y-6"
    >
      <Card title="Contact details" description="Shown in the footer, on the contact page, emails and invoices.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Email" value={v.email} onChange={(email) => setV({ ...v, email })} error={errors.email} type="email" />
          <TextField label="Phone" value={v.phone} onChange={(phone) => setV({ ...v, phone })} error={errors.phone} />
        </div>
        <TextField
          label="WhatsApp number"
          value={v.whatsapp}
          onChange={(whatsapp) => setV({ ...v, whatsapp })}
          error={errors.whatsapp}
          hint="With country code and no + or spaces, e.g. 923001234567. Used for the “Chat with us” button."
          inputMode="numeric"
        />
        <TextField label="Shop address" value={v.address} onChange={(address) => setV({ ...v, address })} multiline />
      </Card>
      <Card title="Social media" description="Leave empty to hide an icon.">
        <div className="grid gap-4 sm:grid-cols-2">
          {(["facebook", "instagram", "youtube", "tiktok", "x"] as const).map((k) => (
            <TextField
              key={k}
              label={{ facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok", x: "X (Twitter)" }[k]}
              value={v.social[k]}
              placeholder="https://"
              onChange={(val) => setV({ ...v, social: { ...v.social, [k]: val } })}
              error={errors[`social.${k}`]}
            />
          ))}
        </div>
      </Card>
      <SaveBar pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------

export function CommerceForm({ initial }: { initial: StoreSettings["commerce"] }) {
  const [v, setV] = useState({ ...initial, freeShippingThreshold: String(initial.freeShippingThreshold / 100), lowStockDefault: String(initial.lowStockDefault) });
  const { pending, errors, save } = useSaver("commerce");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({ ...v, freeShippingThreshold: Math.round((Number(v.freeShippingThreshold) || 0) * 100), lowStockDefault: Math.floor(Number(v.lowStockDefault) || 0) });
      }}
      className="space-y-6"
    >
      <Card title="Currency" description="How prices are shown everywhere in the store, emails and invoices.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Currency code" value={v.currency} onChange={(currency) => setV({ ...v, currency: currency.toUpperCase() })} hint="e.g. PKR, USD, AED, GBP" error={errors.currency} />
          <TextField label="Number format (locale)" value={v.locale} onChange={(locale) => setV({ ...v, locale })} hint="e.g. en-PK, en-US, en-GB" error={errors.locale} />
        </div>
        <p className="text-sm">
          Example:{" "}
          <strong>
            {(() => {
              try {
                return new Intl.NumberFormat(v.locale, { style: "currency", currency: v.currency, maximumFractionDigits: 0 }).format(14999);
              } catch {
                return "-";
              }
            })()}
          </strong>
        </p>
      </Card>
      <Card title="Delivery & stock">
        <TextField
          label={`Free delivery over (${v.currency})`}
          value={v.freeShippingThreshold}
          onChange={(x) => setV({ ...v, freeShippingThreshold: x })}
          inputMode="decimal"
          hint="Orders at or above this amount ship free. Use 0 to turn free delivery off. Delivery rates per city are in Shipping."
          error={errors.freeShippingThreshold}
        />
        <TextField label="Default low-stock alert level" value={v.lowStockDefault} onChange={(x) => setV({ ...v, lowStockDefault: x })} inputMode="numeric" hint="Used for new products." />
      </Card>
      <SaveBar pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------

export function PaymentsForm({ initial }: { initial: StoreSettings["payments"] }) {
  const [v, setV] = useState(initial);
  const { pending, save } = useSaver("payments");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.cod.enabled && !v.bank.enabled && !v.jazzcash.enabled && !v.easypaisa.enabled && !confirm("All payment methods are off - customers will not be able to order. Save anyway?")) return;
        save(v);
      }}
      className="space-y-6"
    >
      <Card title="Cash on delivery">
        <Toggle label="Offer cash on delivery" checked={v.cod.enabled} onChange={(enabled) => setV({ ...v, cod: { ...v.cod, enabled } })} />
        <TextField label="Message shown to the customer" value={v.cod.instructions} onChange={(instructions) => setV({ ...v, cod: { ...v.cod, instructions } })} multiline />
      </Card>
      <Card title="Bank transfer" description="Customers transfer the money and upload a screenshot. You approve it in the order page.">
        <Toggle label="Offer bank transfer" checked={v.bank.enabled} onChange={(enabled) => setV({ ...v, bank: { ...v.bank, enabled } })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Bank name" value={v.bank.account.bankName} onChange={(bankName) => setV({ ...v, bank: { ...v.bank, account: { ...v.bank.account, bankName } } })} />
          <TextField label="Account title" value={v.bank.account.accountTitle} onChange={(accountTitle) => setV({ ...v, bank: { ...v.bank, account: { ...v.bank.account, accountTitle } } })} />
          <TextField label="Account number" value={v.bank.account.accountNumber} onChange={(accountNumber) => setV({ ...v, bank: { ...v.bank, account: { ...v.bank.account, accountNumber } } })} />
          <TextField label="IBAN" value={v.bank.account.iban} onChange={(iban) => setV({ ...v, bank: { ...v.bank, account: { ...v.bank.account, iban } } })} />
        </div>
        <TextField label="Instructions" value={v.bank.instructions} onChange={(instructions) => setV({ ...v, bank: { ...v.bank, instructions } })} multiline />
      </Card>
      {(["jazzcash", "easypaisa"] as const).map((k) => (
        <Card key={k} title={k === "jazzcash" ? "JazzCash" : "Easypaisa"}>
          <Toggle label={`Offer ${k === "jazzcash" ? "JazzCash" : "Easypaisa"}`} checked={v[k].enabled} onChange={(enabled) => setV({ ...v, [k]: { ...v[k], enabled } })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Account title" value={v[k].account.accountTitle} onChange={(accountTitle) => setV({ ...v, [k]: { ...v[k], account: { ...v[k].account, accountTitle } } })} />
            <TextField label="Mobile account number" value={v[k].account.accountNumber} onChange={(accountNumber) => setV({ ...v, [k]: { ...v[k], account: { ...v[k].account, accountNumber } } })} />
          </div>
          <TextField label="Instructions" value={v[k].instructions} onChange={(instructions) => setV({ ...v, [k]: { ...v[k], instructions } })} multiline />
        </Card>
      ))}
      <p className="text-sm text-muted-foreground">Card payments (Safepay, PayFast, …) can be added later by a developer - see src/lib/payments/card-gateway.example.ts.</p>
      <SaveBar pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------

export function NotificationsForm({ initial }: { initial: StoreSettings["notifications"] }) {
  const [v, setV] = useState(initial);
  const { pending, errors, save } = useSaver("notifications");
  const rows = [
    { key: "newOrder", label: "New order" },
    { key: "paymentProof", label: "Payment screenshot uploaded" },
    { key: "lowStock", label: "Low stock" },
  ] as const;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(v);
      }}
      className="space-y-6"
    >
      <Card title="Alerts for you" description="Choose how you hear about important events. The bell in the admin always shows them too.">
        <TextField label="Send owner emails to" value={v.ownerEmail} onChange={(ownerEmail) => setV({ ...v, ownerEmail })} type="email" error={errors.ownerEmail} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead className="text-sm text-muted-foreground">
              <tr>
                <th className="py-2 font-semibold">Event</th>
                <th className="py-2 text-center font-semibold">Telegram</th>
                <th className="py-2 text-center font-semibold">Email</th>
                <th className="py-2 text-center font-semibold">Push</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t">
                  <td className="py-3 font-medium">{r.label}</td>
                  {(["telegram", "email", "push"] as const).map((c) => (
                    <td key={c} className="py-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${r.label} by ${c}`}
                        checked={v[r.key][c]}
                        onChange={(e) => setV({ ...v, [r.key]: { ...v[r.key], [c]: e.target.checked } })}
                        className="size-5 accent-[var(--brand)]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Emails to customers">
        <Toggle label="Order confirmation" description="Sent when an order is placed (if the customer gave an email)." checked={v.customerEmails.confirmation} onChange={(confirmation) => setV({ ...v, customerEmails: { ...v.customerEmails, confirmation } })} />
        <Toggle label="Order updates" description="Confirmed, packed, shipped (with tracking), delivered, payment approved." checked={v.customerEmails.statusUpdates} onChange={(statusUpdates) => setV({ ...v, customerEmails: { ...v.customerEmails, statusUpdates } })} />
      </Card>
      <SaveBar pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------

export function HomepageForm({ initial, products }: { initial: StoreSettings["homepage"]; products: { id: string; title: string }[] }) {
  const [v, setV] = useState(initial);
  const [filter, setFilter] = useState("");
  const { pending, errors, save } = useSaver("homepage");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(v);
      }}
      className="space-y-6"
    >
      <Card title="Hero (top of homepage)">
        <TextField label="Headline" value={v.heroTitle} onChange={(heroTitle) => setV({ ...v, heroTitle })} error={errors.heroTitle} />
        <TextField label="Text under the headline" value={v.heroSubtitle} onChange={(heroSubtitle) => setV({ ...v, heroSubtitle })} multiline />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Button text" value={v.heroCtaLabel} onChange={(heroCtaLabel) => setV({ ...v, heroCtaLabel })} />
          <TextField label="Button link" value={v.heroCtaHref} onChange={(heroCtaHref) => setV({ ...v, heroCtaHref })} hint="e.g. /shop or /category/drones" />
        </div>
      </Card>

      <Card title="Banners" description="Optional promo banners shown after the featured products (up to 6).">
        {v.banners.map((b, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Title" value={b.title} onChange={(title) => setV({ ...v, banners: v.banners.map((x, k) => (k === i ? { ...x, title } : x)) })} />
              <TextField label="Subtitle" value={b.subtitle} onChange={(subtitle) => setV({ ...v, banners: v.banners.map((x, k) => (k === i ? { ...x, subtitle } : x)) })} />
              <TextField label="Button text" value={b.ctaLabel} onChange={(ctaLabel) => setV({ ...v, banners: v.banners.map((x, k) => (k === i ? { ...x, ctaLabel } : x)) })} />
              <TextField label="Link" value={b.ctaHref} onChange={(ctaHref) => setV({ ...v, banners: v.banners.map((x, k) => (k === i ? { ...x, ctaHref } : x)) })} />
            </div>
            <UploadField label="Banner image" value={b.image} folder="banners" onChange={(image) => setV({ ...v, banners: v.banners.map((x, k) => (k === i ? { ...x, image } : x)) })} />
            <button type="button" onClick={() => setV({ ...v, banners: v.banners.filter((_, k) => k !== i) })} className="inline-flex h-10 items-center gap-1 rounded-lg px-2 font-medium text-destructive hover:bg-destructive/5">
              <Trash2 className="size-4" aria-hidden /> Remove banner
            </button>
          </div>
        ))}
        {v.banners.length < 6 && (
          <button type="button" onClick={() => setV({ ...v, banners: [...v.banners, { title: "", subtitle: "", ctaLabel: "Shop now", ctaHref: "/shop", image: "" }] })} className="inline-flex h-11 items-center gap-1 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted">
            <Plus className="size-4" aria-hidden /> Add banner
          </button>
        )}
      </Card>

      <Card title="Featured products" description="Pick products in the order you want them shown. If none are picked, products marked “Featured” are shown.">
        {v.featuredProductIds.length > 0 && (
          <ol className="space-y-2">
            {v.featuredProductIds.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-xl border px-3 py-2">
                <span className="w-6 font-bold">{i + 1}.</span>
                <span className="flex-1">{products.find((p) => p.id === id)?.title ?? "Deleted product"}</span>
                <button type="button" disabled={i === 0} onClick={() => { const a = [...v.featuredProductIds]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setV({ ...v, featuredProductIds: a }); }} className="h-9 rounded-lg border px-2 text-sm disabled:opacity-30" aria-label="Move up">
                  ↑
                </button>
                <button type="button" disabled={i === v.featuredProductIds.length - 1} onClick={() => { const a = [...v.featuredProductIds]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setV({ ...v, featuredProductIds: a }); }} className="h-9 rounded-lg border px-2 text-sm disabled:opacity-30" aria-label="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => setV({ ...v, featuredProductIds: v.featuredProductIds.filter((x) => x !== id) })} className="h-9 rounded-lg px-2 text-sm text-destructive" aria-label="Remove from featured">
                  Remove
                </button>
              </li>
            ))}
          </ol>
        )}
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a product to add…" aria-label="Find a product to add" className="h-11 w-full rounded-xl border-2 border-input bg-background px-3" />
        {filter && (
          <ul className="max-h-56 overflow-y-auto rounded-xl border">
            {products
              .filter((p) => !v.featuredProductIds.includes(p.id) && p.title.toLowerCase().includes(filter.toLowerCase()))
              .slice(0, 20)
              .map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setV({ ...v, featuredProductIds: [...v.featuredProductIds, p.id] })} className="w-full px-3 py-2 text-left hover:bg-muted">
                    + {p.title}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card title="Trust badges" description="The four short promises under the hero.">
        <div className="grid gap-4 sm:grid-cols-2">
          {v.trustBadges.map((b, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <TextField label={`Badge ${i + 1} title`} value={b.title} onChange={(title) => setV({ ...v, trustBadges: v.trustBadges.map((x, k) => (k === i ? { ...x, title } : x)) })} />
              <TextField label="Text" value={b.text} onChange={(text) => setV({ ...v, trustBadges: v.trustBadges.map((x, k) => (k === i ? { ...x, text } : x)) })} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Testimonials">
        {v.testimonials.map((t, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField label="Name" value={t.name} onChange={(name) => setV({ ...v, testimonials: v.testimonials.map((x, k) => (k === i ? { ...x, name } : x)) })} />
              <TextField label="City" value={t.location} onChange={(location) => setV({ ...v, testimonials: v.testimonials.map((x, k) => (k === i ? { ...x, location } : x)) })} />
              <label>
                <span className="mb-1.5 block font-semibold">Stars</span>
                <select value={t.rating} onChange={(e) => setV({ ...v, testimonials: v.testimonials.map((x, k) => (k === i ? { ...x, rating: Number(e.target.value) } : x)) })} className="h-12 w-full rounded-xl border-2 border-input bg-background px-3">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <TextField label="What they said" value={t.text} onChange={(text) => setV({ ...v, testimonials: v.testimonials.map((x, k) => (k === i ? { ...x, text } : x)) })} multiline />
            <button type="button" onClick={() => setV({ ...v, testimonials: v.testimonials.filter((_, k) => k !== i) })} className="inline-flex h-10 items-center gap-1 rounded-lg px-2 font-medium text-destructive hover:bg-destructive/5">
              <Trash2 className="size-4" aria-hidden /> Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setV({ ...v, testimonials: [...v.testimonials, { name: "", location: "", text: "", rating: 5 }] })} className="inline-flex h-11 items-center gap-1 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted">
          <Plus className="size-4" aria-hidden /> Add testimonial
        </button>
      </Card>
      <SaveBar pending={pending} />
    </form>
  );
}
