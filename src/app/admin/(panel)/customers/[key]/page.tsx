import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { getMoneyFormat } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatDate, telLink, whatsappLink } from "@/lib/format";
import { PageHeader } from "@/components/admin/admin-shell";
import { Panel, PaymentBadge, StatCard, StatusBadge } from "@/components/admin/badges";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[key]">) {
  const { key } = await params;
  const [orders, fmt] = await Promise.all([
    db.order.findMany({ where: { phoneNormalized: key }, orderBy: { createdAt: "desc" }, include: { items: true } }),
    getMoneyFormat(),
  ]);
  if (!orders.length) notFound();
  const latest = orders[0];
  const valid = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED");
  const spent = valid.reduce((s, o) => s + o.total, 0);
  const addresses = [...new Set(orders.map((o) => `${o.address}, ${o.city}`))];
  const m = (n: number) => formatMoney(n, fmt);

  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All customers
      </Link>
      <PageHeader
        title={latest.customerName}
        description={[latest.phone, latest.email].filter(Boolean).join(" · ")}
        actions={
          <>
            <a href={telLink(latest.phone)} className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
              <Phone className="size-4" aria-hidden /> Call
            </a>
            <a href={whatsappLink(key)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#128c4a] px-4 font-semibold text-white">
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders" value={String(orders.length)} />
        <StatCard label="Total spent" value={m(spent)} />
        <StatCard label="Average order" value={m(valid.length ? Math.round(spent / valid.length / 100) * 100 : 0)} />
        <StatCard label="Customer since" value={formatDate(orders[orders.length - 1].createdAt)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Order history">
          <ul className="divide-y">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                    #{o.number}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(o.createdAt)} · {o.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  <PaymentBadge status={o.paymentStatus} />
                  <span className="w-28 text-right font-semibold tabular-nums">{m(o.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Addresses used">
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li key={a} className="rounded-xl bg-muted p-3">
                {a}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
