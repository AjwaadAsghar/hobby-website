import "server-only";
import type { Prisma } from "@prisma/client";
import { containsText } from "@/lib/db";
import { normalizePhone } from "@/lib/format";
import { ORDER_STATUSES, PENDING_STATUSES } from "@/lib/order-status";

export type OrderFilters = { q?: string; status?: string; payment?: string; from?: string; to?: string; page: number };

export function parseOrderFilters(sp: Record<string, string | string[] | undefined>): OrderFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  return {
    q: one(sp.q)?.slice(0, 100),
    status: one(sp.status),
    payment: one(sp.payment),
    from: one(sp.from),
    to: one(sp.to),
    page: Math.max(1, Number(one(sp.page)) || 1),
  };
}

export function buildOrderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = [];
  if (f.q) {
    const q = f.q.replace(/^#/, "");
    const or: Prisma.OrderWhereInput[] = [{ customerName: containsText(q) }, { email: containsText(q) }, { city: containsText(q) }];
    if (/^\d{4,7}$/.test(q)) or.push({ number: Number(q) });
    const digits = normalizePhone(q);
    if (digits.length >= 6) or.push({ phoneNormalized: { contains: digits.slice(-10) } });
    and.push({ OR: or });
  }
  if (f.status === "pending") and.push({ OR: [{ status: { in: PENDING_STATUSES } }, { paymentStatus: "AWAITING_VERIFICATION" }] });
  else if (f.status === "verify") and.push({ paymentStatus: "AWAITING_VERIFICATION" });
  else if (f.status && (ORDER_STATUSES as readonly string[]).includes(f.status)) and.push({ status: f.status });
  if (f.payment) and.push({ paymentMethod: f.payment });
  const from = f.from ? new Date(`${f.from}T00:00:00`) : null;
  const to = f.to ? new Date(`${f.to}T23:59:59.999`) : null;
  if (from && !isNaN(from.getTime())) and.push({ createdAt: { gte: from } });
  if (to && !isNaN(to.getTime())) and.push({ createdAt: { lte: to } });
  return and.length ? { AND: and } : {};
}
