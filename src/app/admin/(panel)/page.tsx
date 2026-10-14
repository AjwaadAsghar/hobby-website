import Link from "next/link";
import { db } from "@/lib/db";
import { getMoneyFormat } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { daysAgo, getDashboardStats, getSalesSeries, getTopProducts } from "@/server/admin-stats";
import { PageHeader } from "@/components/admin/admin-shell";
import { Panel, PaymentBadge, StatCard, StatusBadge } from "@/components/admin/badges";
import { RankedBars, RevenueChart } from "@/components/admin/charts";
import { LiveIndicator } from "@/components/admin/live-indicator";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const [stats, series, top, recent, fmt] = await Promise.all([
    getDashboardStats(),
    getSalesSeries(),
    getTopProducts(daysAgo(30), 5),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    getMoneyFormat(),
  ]);
  const m = (n: number) => formatMoney(n, fmt);

  return (
    <>
      {sp.welcome && (
        <p role="status" className="mb-6 rounded-2xl bg-success/10 p-4 font-medium text-success">
          Password updated. Welcome! Start by checking Settings to make the store your own.
        </p>
      )}
      {sp.denied && (
        <p role="alert" className="mb-6 rounded-2xl bg-destructive/5 p-4 font-medium text-destructive">
          Only the store owner can open that page.
        </p>
      )}
      <PageHeader title="Dashboard" description="How the store is doing today." actions={<LiveIndicator />} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard label="Today's revenue" value={m(stats.todayRevenue)} sub={`${stats.todayOrders} order${stats.todayOrders === 1 ? "" : "s"} today`} />
        <StatCard label="This month" value={m(stats.monthRevenue)} sub={`${stats.monthOrders} orders`} />
        <StatCard label="Total orders" value={stats.totalOrders.toLocaleString()} href="/admin/orders" />
        <StatCard
          label="Pending orders"
          value={String(stats.pending)}
          sub={stats.awaitingPayment ? `${stats.awaitingPayment} payment${stats.awaitingPayment > 1 ? "s" : ""} to verify` : "New, confirmed or packed"}
          tone={stats.pending || stats.awaitingPayment ? "warning" : "default"}
          href="/admin/orders?status=pending"
        />
        <StatCard label="Low stock items" value={String(stats.lowStock)} tone={stats.lowStock ? "warning" : "default"} href="/admin/inventory?filter=low" sub="At or below alert level" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <RevenueChart data={series} />
        </Panel>
        <Panel title="Best sellers (30 days)" action={<Link href="/admin/reports" className="text-sm font-semibold underline underline-offset-4">Reports</Link>}>
          <RankedBars rows={top.map((t) => ({ label: t.title, value: t.revenue, sub: `${t.quantity} sold` }))} />
        </Panel>
      </div>

      <Panel title="Recent orders" className="mt-6" action={<Link href="/admin/orders" className="text-sm font-semibold underline underline-offset-4">All orders</Link>}>
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b text-sm text-muted-foreground">
              <tr>
                <th className="px-5 py-2 font-semibold">Order</th>
                <th className="px-2 py-2 font-semibold">Customer</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Payment</th>
                <th className="px-5 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold underline-offset-4 hover:underline">
                      #{o.number}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDate(o.createdAt, true)}</p>
                  </td>
                  <td className="px-2 py-3">
                    {o.customerName}
                    <p className="text-xs text-muted-foreground">{o.city}</p>
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-2 py-3">
                    <PaymentBadge status={o.paymentStatus} />
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">{m(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
