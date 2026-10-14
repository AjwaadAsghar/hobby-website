import "server-only";
import { db } from "@/lib/db";
import { PENDING_STATUSES } from "@/lib/order-status";

/** Orders that count as sales (cancelled/returned excluded). */
export const SALE_FILTER = { status: { notIn: ["CANCELLED", "RETURNED"] } };

/** Number of published products/variants at or below their low-stock threshold. */
export async function lowStockCount() {
  const [products, variants] = await Promise.all([
    db.$queryRawUnsafe<{ c: number | bigint }[]>(
      `SELECT COUNT(*) as c FROM "Product" p WHERE p."status" = 'PUBLISHED' AND p."stock" <= p."lowStockThreshold" AND NOT EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p."id")`,
    ),
    db.$queryRawUnsafe<{ c: number | bigint }[]>(
      `SELECT COUNT(*) as c FROM "ProductVariant" v JOIN "Product" p ON p."id" = v."productId" WHERE p."status" = 'PUBLISHED' AND v."stock" <= p."lowStockThreshold"`,
    ),
  ]);
  return Number(products[0]?.c ?? 0) + Number(variants[0]?.c ?? 0);
}

export function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export type SeriesPoint = { key: string; label: string; revenue: number; orders: number; profit: number };

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function weekStart(d: Date) {
  const s = startOfDay(d);
  const day = (s.getDay() + 6) % 7; // Monday = 0
  s.setDate(s.getDate() - day);
  return s;
}

/** Revenue/orders/profit buckets for daily (30d), weekly (12w) and monthly (12m) charts. */
export async function getSalesSeries(from?: Date, to?: Date) {
  const now = new Date();
  const since = from ?? new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const until = to ?? now;
  const orders = await db.order.findMany({
    where: { ...SALE_FILTER, createdAt: { gte: since, lte: until } },
    select: { createdAt: true, total: true, shippingTotal: true, items: { select: { unitCost: true, quantity: true, lineTotal: true } }, discountTotal: true },
  });

  const profitOf = (o: (typeof orders)[number]) =>
    o.items.reduce((s, i) => s + i.lineTotal - i.unitCost * i.quantity, 0) - o.discountTotal;

  const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const fmtMonth = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });

  function bucket(keys: { key: string; label: string; start: Date; end: Date }[]): SeriesPoint[] {
    return keys.map((k) => {
      const inRange = orders.filter((o) => o.createdAt >= k.start && o.createdAt < k.end);
      return {
        key: k.key,
        label: k.label,
        revenue: inRange.reduce((s, o) => s + o.total, 0),
        orders: inRange.length,
        profit: inRange.reduce((s, o) => s + profitOf(o), 0),
      };
    });
  }

  const daily = bucket(
    Array.from({ length: 30 }, (_, i) => {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29 + i));
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
      return { key: dayKey(start), label: fmtDay(start), start, end };
    }),
  );
  const thisWeek = weekStart(now);
  const weekly = bucket(
    Array.from({ length: 12 }, (_, i) => {
      const start = new Date(thisWeek.getFullYear(), thisWeek.getMonth(), thisWeek.getDate() - (11 - i) * 7);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      return { key: dayKey(start), label: fmtDay(start), start, end };
    }),
  );
  const monthly = bucket(
    Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return { key: dayKey(start), label: fmtMonth(start), start, end };
    }),
  );
  return { daily, weekly, monthly };
}

export async function getDashboardStats() {
  const now = new Date();
  const today = startOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [todayAgg, monthAgg, totalOrders, pending, awaitingPayment, lowStock] = await Promise.all([
    db.order.aggregate({ where: { ...SALE_FILTER, createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: { ...SALE_FILTER, createdAt: { gte: monthStart } }, _sum: { total: true }, _count: true }),
    db.order.count(),
    db.order.count({ where: { status: { in: PENDING_STATUSES } } }),
    db.order.count({ where: { paymentStatus: "AWAITING_VERIFICATION" } }),
    lowStockCount(),
  ]);
  return {
    todayRevenue: todayAgg._sum.total ?? 0,
    todayOrders: todayAgg._count,
    monthRevenue: monthAgg._sum.total ?? 0,
    monthOrders: monthAgg._count,
    totalOrders,
    pending,
    awaitingPayment,
    lowStock,
  };
}

export async function getTopProducts(since: Date, take = 5) {
  const rows = await db.orderItem.groupBy({
    by: ["productId", "title"],
    where: { order: { ...SALE_FILTER, createdAt: { gte: since } } },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: take * 2,
  });
  // Merge rows of the same product (variants share a product id).
  const merged = new Map<string, { productId: string | null; title: string; quantity: number; revenue: number }>();
  for (const r of rows) {
    const key = r.productId ?? r.title;
    const prev = merged.get(key);
    merged.set(key, {
      productId: r.productId,
      title: r.title,
      quantity: (prev?.quantity ?? 0) + (r._sum.quantity ?? 0),
      revenue: (prev?.revenue ?? 0) + (r._sum.lineTotal ?? 0),
    });
  }
  return [...merged.values()].sort((a, b) => b.revenue - a.revenue).slice(0, take);
}

export async function getTopCities(since: Date, take = 8) {
  const rows = await db.order.groupBy({
    by: ["city"],
    where: { ...SALE_FILTER, createdAt: { gte: since } },
    _sum: { total: true },
    _count: true,
    orderBy: { _sum: { total: "desc" } },
    take,
  });
  return rows.map((r) => ({ city: r.city, revenue: r._sum.total ?? 0, orders: r._count }));
}
