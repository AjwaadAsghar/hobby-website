import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { db as defaultDb } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";

type Db = PrismaClient | Prisma.TransactionClient;

export type CartInputLine = { productId: string; variantId: string | null; qty: number };

export type QuotedLine = {
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  variantName: string | null;
  sku: string | null;
  image: string | null;
  unitPrice: number;
  unitCost: number;
  qty: number;
  maxQty: number;
  lineTotal: number;
  /** Plain-English problem, e.g. "Only 2 left - we reduced your quantity." */
  problem: string | null;
};

export type Quote = {
  lines: QuotedLine[];
  subtotal: number;
  discount: { code: string; amount: number; valid: boolean; message: string } | null;
  shipping: { zone: string; amount: number; free: boolean } | null;
  total: number;
  problems: string[];
};

export async function findShipping(city: string, afterDiscountSubtotal: number, client: Db = defaultDb) {
  const settings = await getSettings();
  const zones = await client.shippingZone.findMany({ orderBy: { sortOrder: "asc" } });
  const c = city.trim().toLowerCase();
  const zone =
    zones.find((z) => parseJson<string[]>(z.cities, []).some((x) => x.trim().toLowerCase() === c)) ??
    zones.find((z) => z.isDefault) ??
    null;
  const threshold = settings.commerce.freeShippingThreshold;
  const free = threshold > 0 && afterDiscountSubtotal >= threshold;
  if (!zone) return { zone: "Standard delivery", amount: 0, free };
  return { zone: zone.name, amount: free ? 0 : zone.rate, free };
}

export async function evaluateDiscount(code: string, subtotal: number, client: Db = defaultDb) {
  const settings = await getSettings();
  const fmt = { currency: settings.commerce.currency, locale: settings.commerce.locale };
  const normalized = code.trim().toUpperCase();
  const d = await client.discountCode.findUnique({ where: { code: normalized } });
  const invalid = (message: string) => ({ code: normalized, amount: 0, valid: false, message, id: null as string | null });
  if (!d || !d.isActive) return invalid("This discount code is not valid. Please check the spelling.");
  if (d.expiresAt && d.expiresAt < new Date()) return invalid("This discount code has expired.");
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return invalid("This discount code has already been fully used.");
  if (subtotal < d.minOrder) return invalid(`This code needs an order of at least ${formatMoney(d.minOrder, fmt)}.`);
  const amount = Math.min(subtotal, d.type === "PERCENT" ? Math.round((subtotal * Math.min(100, d.value)) / 10000) * 100 : d.value);
  const label = d.type === "PERCENT" ? `${d.value}% off` : `${formatMoney(d.value, fmt)} off`;
  return { code: normalized, amount, valid: true, message: `${label} applied.`, id: d.id };
}

/**
 * The single source of truth for prices. Used by the cart page and again,
 * inside the order transaction, when the order is placed.
 */
export async function quoteCart(
  input: { lines: CartInputLine[]; discountCode?: string; city?: string },
  client: Db = defaultDb,
): Promise<Quote & { discountId: string | null }> {
  const merged = new Map<string, CartInputLine>();
  for (const l of input.lines) {
    const key = `${l.productId}:${l.variantId ?? "-"}`;
    const prev = merged.get(key);
    merged.set(key, { ...l, qty: (prev?.qty ?? 0) + Math.max(0, Math.floor(l.qty)) });
  }
  const items = [...merged.values()].filter((l) => l.qty > 0).slice(0, 50);

  const products = await client.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true },
  });

  const lines: QuotedLine[] = [];
  const problems: string[] = [];
  for (const item of items) {
    const p = products.find((x) => x.id === item.productId);
    const key = `${item.productId}:${item.variantId ?? "-"}`;
    if (!p || p.status !== "PUBLISHED") {
      problems.push("One item in your cart is no longer available and was removed.");
      continue;
    }
    const variant = item.variantId ? p.variants.find((v) => v.id === item.variantId) : null;
    if (item.variantId && !variant) {
      problems.push(`The option you chose for "${p.title}" is no longer available.`);
      continue;
    }
    if (!item.variantId && p.variants.length > 0) {
      problems.push(`Please choose an option for "${p.title}".`);
      continue;
    }
    const stock = Math.max(0, variant ? variant.stock : p.stock);
    const unitPrice = variant?.price ?? p.price;
    let qty = item.qty;
    let problem: string | null = null;
    if (stock === 0) {
      problem = "Sorry, this is now out of stock.";
      qty = 0;
    } else if (qty > stock) {
      problem = `Only ${stock} left - we reduced your quantity.`;
      qty = stock;
    }
    if (problem) problems.push(`${p.title}${variant ? ` (${variant.name})` : ""}: ${problem}`);
    lines.push({
      key,
      productId: p.id,
      variantId: variant?.id ?? null,
      slug: p.slug,
      title: p.title,
      variantName: variant?.name ?? null,
      sku: variant?.sku ?? p.sku,
      image: p.images[0]?.url ?? null,
      unitPrice,
      unitCost: p.costPrice ?? 0,
      qty,
      maxQty: stock,
      lineTotal: unitPrice * qty,
      problem,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  let discount: Quote["discount"] = null;
  let discountId: string | null = null;
  if (input.discountCode?.trim()) {
    const d = await evaluateDiscount(input.discountCode, subtotal, client);
    discount = { code: d.code, amount: d.amount, valid: d.valid, message: d.message };
    discountId = d.id;
  }
  const discountAmount = discount?.valid ? discount.amount : 0;
  const shipping = input.city?.trim() ? await findShipping(input.city, subtotal - discountAmount, client) : null;
  const total = Math.max(0, subtotal - discountAmount + (shipping?.amount ?? 0));

  return { lines, subtotal, discount, shipping, total, problems, discountId };
}
