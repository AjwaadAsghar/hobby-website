import Link from "next/link";
import { getMoneyFormat } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { paymentLabel } from "@/lib/payments/registry";
import { getReport } from "@/server/admin-stats";
import { PageHeader } from "@/components/admin/admin-shell";
import { Panel, StatCard } from "@/components/admin/badges";
import { OrdersChart, RankedBars, RevenueProfitChart } from "@/components/admin/charts";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reports" };

const presets = [
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "90", label: "Last 90 days" },
  { id: "365", label: "Last 12 months" },
];

function parseRange(sp: Record<string, string | string[] | undefined>) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const from = one(sp.from);
  const to = one(sp.to);
  if (from && to && !isNaN(Date.parse(from)) && !isNaN(Date.parse(to))) {
    return { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59.999`), preset: "custom", fromStr: from, toStr: to };
  }
  const days = presets.some((p) => p.id === one(sp.range)) ? Number(one(sp.range)) : 30;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);
  return { from: start, to: now, preset: String(days), fromStr: start.toISOString().slice(0, 10), toStr: now.toISOString().slice(0, 10) };
}

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  const range = parseRange(await searchParams);
  const [r, fmt] = await Promise.all([getReport(range.from, range.to), getMoneyFormat()]);
  const m = (n: number) => formatMoney(n, fmt);
  const margin = r.revenue ? Math.round((r.profit / r.revenue) * 100) : 0;

  return (
    <>
      <PageHeader title="Reports" description="Sales, profit and what is selling. Cancelled and returned orders are left out." />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <nav aria-label="Date range" className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Link
              key={p.id}
              href={`/admin/reports?range=${p.id}`}
              aria-current={range.preset === p.id ? "page" : undefined}
              className={cn("rounded-full border px-4 py-2 font-semibold", range.preset === p.id ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted")}
            >
              {p.label}
            </Link>
          ))}
        </nav>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label>
            <span className="block text-sm font-semibold">From</span>
            <input type="date" name="from" defaultValue={range.fromStr} className="h-11 rounded-xl border-2 border-input bg-background px-2" />
          </label>
          <label>
            <span className="block text-sm font-semibold">To</span>
            <input type="date" name="to" defaultValue={range.toStr} className="h-11 rounded-xl border-2 border-input bg-background px-2" />
          </label>
          <button className="h-11 rounded-xl bg-foreground px-4 font-semibold text-background">Show</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard label="Revenue" value={m(r.revenue)} />
        <StatCard label="Profit" value={m(r.profit)} sub={`${margin}% margin (uses cost prices)`} />
        <StatCard label="Orders" value={String(r.orders)} sub={r.cancelled ? `${r.cancelled} cancelled/returned` : undefined} />
        <StatCard label="Average order" value={m(r.aov)} />
        <StatCard label="Items sold" value={String(r.itemsSold)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={`Revenue and profit (${r.monthly ? "by month" : "by day"})`}>
          <RevenueProfitChart data={r.series} />
        </Panel>
        <Panel title={`Orders (${r.monthly ? "by month" : "by day"})`}>
          <OrdersChart data={r.series} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Top products">
          <RankedBars rows={r.topProducts.map((p) => ({ label: p.title, value: p.revenue, sub: `${p.quantity} sold` }))} />
        </Panel>
        <Panel title="Top cities">
          <RankedBars rows={r.topCities.map((c) => ({ label: c.city, value: c.revenue, sub: `${c.orders} orders` }))} />
        </Panel>
        <Panel title="Payment methods">
          <RankedBars rows={r.paymentMethods.map((p) => ({ label: paymentLabel(p.method), value: p.revenue, sub: `${p.orders} orders` }))} />
        </Panel>
      </div>
    </>
  );
}
