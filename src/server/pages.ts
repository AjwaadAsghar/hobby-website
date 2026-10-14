import "server-only";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { defaultPages, fillPageTokens } from "@/config/default-pages";
import { escapeHtml, sanitizeRichText } from "@/lib/sanitize";

/** Loads an editable page and fills in {{storeName}} etc. from current settings. */
export async function getCmsPage(slug: string) {
  const [page, s] = await Promise.all([db.page.findUnique({ where: { slug } }), getSettings()]);
  const source = page ?? (defaultPages[slug] ? { title: defaultPages[slug].title, content: defaultPages[slug].content, updatedAt: null } : null);
  if (!source) return null;
  const fmt = { currency: s.commerce.currency, locale: s.commerce.locale };
  const tokens: Record<string, string> = {
    storeName: escapeHtml(s.branding.storeName),
    email: escapeHtml(s.contact.email),
    phone: escapeHtml(s.contact.phone),
    whatsapp: escapeHtml(s.contact.whatsapp),
    address: escapeHtml(s.contact.address),
    freeShippingThreshold: s.commerce.freeShippingThreshold > 0 ? escapeHtml(formatMoney(s.commerce.freeShippingThreshold, fmt)) : "a set amount",
  };
  return {
    title: fillPageTokens(source.title, tokens).replace(/&amp;/g, "&"),
    html: sanitizeRichText(fillPageTokens(source.content, tokens)),
    updatedAt: source.updatedAt,
  };
}
