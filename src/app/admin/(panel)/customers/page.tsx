import Link from "next/link";
import { Search } from "lucide-react";
import { db, containsText } from "@/lib/db";
import { getMoneyFormat } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatDate, normalizePhone } from "@/lib/format";
import { PageHeader } from "@/components/admin/admin-shell";
import { markMessageRead } from "./actions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Customers" };

const tabs = [
  { id: "customers", label: "Customers" },
  { id: "accounts", label: "Accounts" },
  { id: "messages", label: "Messages" },
  { id: "newsletter", label: "Newsletter" },
];

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const tab = tabs.find((t) => t.id === sp.tab)?.id ?? "customers";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const fmt = await getMoneyFormat();
  const unread = await db.contactMessage.count({ where: { isRead: false } });

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has ordered, grouped by phone number." />
      <nav aria-label="Customer sections" className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/customers?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn("rounded-full border px-4 py-2 font-semibold", tab === t.id ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted")}
          >
            {t.label}
            {t.id === "messages" && unread > 0 && <span className="ml-1.5 rounded-full bg-brand px-1.5 text-xs text-brand-foreground">{unread}</span>}
          </Link>
        ))}
      </nav>
      {tab === "customers" && <CustomersTab q={q} fmt={fmt} />}
      {tab === "accounts" && <AccountsTab />}
      {tab === "messages" && <MessagesTab />}
      {tab === "newsletter" && <NewsletterTab />}
    </>
  );
}

async function CustomersTab({ q, fmt }: { q: string; fmt: { currency: string; locale: string } }) {
  const digits = normalizePhone(q);
  const where = q
    ? { OR: [{ customerName: containsText(q) }, { email: containsText(q) }, { city: containsText(q) }, ...(digits.length >= 4 ? [{ phoneNormalized: { contains: digits.slice(-10) } }] : [])] }
    : {};
  const groups = await db.order.groupBy({
    by: ["phoneNormalized"],
    where,
    _count: true,
    _sum: { total: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 300,
  });
  const spent = await db.order.groupBy({
    by: ["phoneNormalized"],
    where: { phoneNormalized: { in: groups.map((g) => g.phoneNormalized) }, status: { notIn: ["CANCELLED", "RETURNED"] } },
    _sum: { total: true },
  });
  const latest = await db.order.findMany({
    where: { phoneNormalized: { in: groups.map((g) => g.phoneNormalized) } },
    orderBy: { createdAt: "desc" },
    distinct: ["phoneNormalized"],
    select: { phoneNormalized: true, customerName: true, phone: true, email: true, city: true },
  });
  return (
    <>
      <form method="get" className="mb-4 flex gap-2">
        <input type="hidden" name="tab" value="customers" />
        <label className="relative max-w-md flex-1">
          <span className="sr-only">Search customers</span>
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Name, phone, email or city" className="h-11 w-full rounded-xl border-2 border-input bg-background pr-3 pl-9" />
        </label>
        <button className="h-11 rounded-xl bg-foreground px-4 font-semibold text-background">Search</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-left">
          <thead className="border-b bg-muted/50 text-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">City</th>
              <th className="px-3 py-3 text-right font-semibold">Orders</th>
              <th className="px-3 py-3 text-right font-semibold">Total spent</th>
              <th className="px-4 py-3 font-semibold">Last order</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No customers found.
                </td>
              </tr>
            )}
            {groups.map((g) => {
              const info = latest.find((l) => l.phoneNormalized === g.phoneNormalized);
              const total = spent.find((s) => s.phoneNormalized === g.phoneNormalized)?._sum.total ?? 0;
              return (
                <tr key={g.phoneNormalized} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${g.phoneNormalized}`} className="font-semibold hover:underline">
                      {info?.customerName ?? g.phoneNormalized}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {info?.phone}
                      {info?.email && ` · ${info.email}`}
                    </p>
                  </td>
                  <td className="px-3 py-3">{info?.city}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{g._count}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatMoney(total, fmt)}</td>
                  <td className="px-4 py-3 text-sm">{g._max.createdAt ? formatDate(g._max.createdAt) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function AccountsTab() {
  const users = await db.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" }, include: { _count: { select: { orders: true } } }, take: 300 });
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
      <table className="w-full min-w-[600px] text-left">
        <thead className="border-b bg-muted/50 text-sm">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-3 py-3 font-semibold">Email</th>
            <th className="px-3 py-3 font-semibold">Phone</th>
            <th className="px-3 py-3 text-right font-semibold">Orders</th>
            <th className="px-4 py-3 font-semibold">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                No customer accounts yet. Customers can order without one.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-semibold">{u.name}</td>
              <td className="px-3 py-3">{u.email}</td>
              <td className="px-3 py-3">{u.phone ?? "-"}</td>
              <td className="px-3 py-3 text-right tabular-nums">{u._count.orders}</td>
              <td className="px-4 py-3 text-sm">{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function MessagesTab() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  if (!messages.length) return <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">No messages from the contact form yet.</p>;
  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li key={m.id} className={cn("rounded-2xl border bg-card p-5 shadow-sm", !m.isRead && "border-brand")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {m.name} {!m.isRead && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs text-brand-foreground">New</span>}
              </p>
              <p className="text-sm text-muted-foreground">
                {[m.phone, m.email].filter(Boolean).join(" · ")} · {formatDate(m.createdAt, true)}
              </p>
            </div>
            {!m.isRead && (
              <form action={markMessageRead}>
                <input type="hidden" name="id" value={m.id} />
                <button className="h-10 rounded-lg border-2 border-input px-3 text-sm font-semibold hover:bg-muted">Mark as read</button>
              </form>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap">{m.message}</p>
          <div className="mt-3 flex gap-3 text-sm font-semibold">
            {m.email && <a href={`mailto:${m.email}`} className="underline underline-offset-4">Reply by email</a>}
            {m.phone && (
              <a href={`https://wa.me/${normalizePhone(m.phone)}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                WhatsApp
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

async function NewsletterTab() {
  const subs = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        {subs.length} subscriber{subs.length === 1 ? "" : "s"}. Copy the list below into your email tool (e.g. Mailchimp, Brevo).
      </p>
      <label className="block">
        <span className="sr-only">All subscriber emails</span>
        <textarea readOnly value={subs.map((s) => s.email).join(", ")} rows={6} className="w-full rounded-xl border-2 border-input bg-background p-3 font-mono text-sm" />
      </label>
      <ul className="divide-y rounded-2xl border bg-card">
        {subs.map((s) => (
          <li key={s.id} className="flex justify-between px-4 py-2">
            <span>{s.email}</span>
            <span className="text-sm text-muted-foreground">{formatDate(s.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
