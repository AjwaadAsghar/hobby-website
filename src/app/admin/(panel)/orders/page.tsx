import Link from "next/link";
import { Download, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getMoneyFormat } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { paymentLabel, paymentProviders } from "@/lib/payments/registry";
import { buildOrderWhere, parseOrderFilters } from "@/server/admin-orders";
import { PageHeader } from "@/components/admin/admin-shell";
import { PaymentBadge, StatusBadge } from "@/components/admin/badges";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };
const PAGE_SIZE = 25;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const f = parseOrderFilters(sp);
  const where = buildOrderWhere(f);
  const [total, orders, fmt] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    getMoneyFormat(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: f.q, status: f.status, payment: f.payment, from: f.from, to: f.to, ...extra })) if (v) p.set(k, String(v));
    return p.toString();
  };
  const tabs = [
    { value: "", label: "All" },
    { value: "pending", label: "Needs action" },
    { value: "verify", label: "Verify payment" },
    { value: "NEW", label: "New" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${total} order${total === 1 ? "" : "s"}`}
        actions={
          <>
            <a href={`/api/admin/orders/export?${qs({ format: "csv" })}`} className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
            <a href={`/api/admin/orders/export?${qs({ format: "xlsx" })}`} className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
              <Download className="size-4" aria-hidden /> Export Excel
            </a>
          </>
        }
      />

      <nav aria-label="Order views" className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = (f.status ?? "") === t.value;
          return (
            <Link
              key={t.value}
              href={`/admin/orders?${qs({ status: t.value || undefined, page: undefined })}`}
              aria-current={active ? "page" : undefined}
              className={cn("rounded-full border px-4 py-2 text-sm font-semibold", active ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted")}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <form method="get" className="mb-4 grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <label className="relative">
          <span className="sr-only">Search orders</span>
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={f.q} placeholder="Order #, name, phone, email, city" className="h-11 w-full rounded-xl border-2 border-input bg-background pr-3 pl-9" />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={f.status ?? ""} className="h-11 w-full rounded-xl border-2 border-input bg-background px-3">
            <option value="">Any status</option>
            <option value="pending">Needs action</option>
            <option value="verify">Payment to verify</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Payment method</span>
          <select name="payment" defaultValue={f.payment ?? ""} className="h-11 w-full rounded-xl border-2 border-input bg-background px-3">
            <option value="">Any payment</option>
            {paymentProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {paymentLabel(p.id)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">From</span>
          <input type="date" name="from" defaultValue={f.from} className="h-11 w-full rounded-xl border-2 border-input bg-background px-2" />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">To</span>
          <input type="date" name="to" defaultValue={f.to} className="h-11 w-full rounded-xl border-2 border-input bg-background px-2" />
        </label>
        <div className="flex gap-2">
          <button className="h-11 rounded-xl bg-foreground px-4 font-semibold text-background">Filter</button>
          <Link href="/admin/orders" className="inline-flex h-11 items-center rounded-xl px-3 font-semibold hover:bg-muted">
            Clear
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[860px] text-left">
          <thead className="border-b bg-muted/50 text-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-3 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">Items</th>
              <th className="px-3 py-3 font-semibold">Payment</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No orders match these filters.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-bold underline-offset-4 hover:underline">
                    #{o.number}
                  </Link>
                  <p className="text-sm text-muted-foreground">{formatDate(o.createdAt, true)}</p>
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{o.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {o.phone} · {o.city}
                  </p>
                </td>
                <td className="px-3 py-3 tabular-nums">{o._count.items}</td>
                <td className="px-3 py-3">
                  <p className="text-sm">{paymentLabel(o.paymentMethod)}</p>
                  <PaymentBadge status={o.paymentStatus} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(o.total, fmt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {f.page} of {pages}
          </p>
          <div className="flex gap-2">
            {f.page > 1 && (
              <Link href={`/admin/orders?${qs({ page: f.page - 1 })}`} className="inline-flex h-11 items-center rounded-xl border-2 border-input bg-background px-4 font-semibold">
                Previous
              </Link>
            )}
            {f.page < pages && (
              <Link href={`/admin/orders?${qs({ page: f.page + 1 })}`} className="inline-flex h-11 items-center rounded-xl border-2 border-input bg-background px-4 font-semibold">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
