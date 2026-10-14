import { z } from "zod";

const url = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), "Please enter a full web address starting with https://");
const text = (max = 300) => z.string().trim().max(max);

export const brandingSchema = z.object({
  storeName: z.string().trim().min(1, "The store needs a name.").max(60),
  tagline: text(140),
  logoUrl: url,
  faviconUrl: url,
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Please pick a colour (like #D7261E)."),
});

export const contactSchema = z.object({
  email: z.union([z.literal(""), z.string().trim().email("Please enter a valid email address.")]),
  phone: text(40),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || v.length >= 10, "Use the full international number with country code, e.g. 923001234567."),
  address: text(300),
  social: z.object({ facebook: url, instagram: url, youtube: url, tiktok: url, x: url }),
});

export const commerceSchema = z.object({
  currency: z.string().trim().length(3, "Use a 3-letter currency code like PKR, USD or AED.").toUpperCase(),
  locale: z
    .string()
    .trim()
    .max(20)
    .refine((v) => {
      try {
        new Intl.NumberFormat(v);
        return true;
      } catch {
        return false;
      }
    }, "Unknown locale. Examples: en-PK, en-US, en-GB."),
  /** Minor units */
  freeShippingThreshold: z.number().int().min(0).max(1_000_000_000),
  lowStockDefault: z.number().int().min(0).max(10_000),
});

const wallet = z.object({ accountTitle: text(80), accountNumber: text(40) });
export const paymentsSchema = z.object({
  cod: z.object({ enabled: z.boolean(), instructions: text(500) }),
  bank: z.object({ enabled: z.boolean(), instructions: text(500), account: z.object({ bankName: text(80), accountTitle: text(80), accountNumber: text(40), iban: text(40) }) }),
  jazzcash: z.object({ enabled: z.boolean(), instructions: text(500), account: wallet }),
  easypaisa: z.object({ enabled: z.boolean(), instructions: text(500), account: wallet }),
});

const channels = z.object({ telegram: z.boolean(), email: z.boolean(), push: z.boolean() });
export const notificationsSchema = z.object({
  ownerEmail: z.union([z.literal(""), z.string().trim().email("Please enter a valid email address.")]),
  newOrder: channels,
  lowStock: channels,
  paymentProof: channels,
  customerEmails: z.object({ confirmation: z.boolean(), statusUpdates: z.boolean() }),
});

export const homepageSchema = z.object({
  heroTitle: text(120).min(1, "Please enter a headline."),
  heroSubtitle: text(400),
  heroCtaLabel: text(40),
  heroCtaHref: text(300),
  banners: z.array(z.object({ title: text(80), subtitle: text(200), ctaLabel: text(40), ctaHref: text(300), image: url })).max(6),
  featuredProductIds: z.array(z.string().max(40)).max(24),
  testimonials: z.array(z.object({ name: text(60), location: text(60), text: text(600), rating: z.number().int().min(1).max(5) })).max(12),
  trustBadges: z.array(z.object({ title: text(40), text: text(100) })).max(4),
});

export const settingsSchemas = {
  branding: brandingSchema,
  contact: contactSchema,
  commerce: commerceSchema,
  payments: paymentsSchema,
  notifications: notificationsSchema,
  homepage: homepageSchema,
} as const;
