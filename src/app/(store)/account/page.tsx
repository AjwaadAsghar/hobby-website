import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getMoneyFormat } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/order-status";
import { logoutAction } from "@/server/auth-actions";
import { deleteAddress, makeDefaultAddress } from "./actions";
import { AddressForm } from "./address-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await getCustomer();
  if (!user) redirect("/account/login");
  const [orders, addresses, fmt] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
      take: 50,
    }),
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    getMoneyFormat(),
  ]);
  const isAdmin = user.role === "OWNER" || user.role === "STAFF";

  return (
    <div className="container-store py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Hello, {user.name.split(" ")[0]}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Link href="/admin" className="inline-flex h-12 items-center rounded-xl bg-foreground px-5 font-semibold text-background">
              Open admin
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit" className="h-12 rounded-xl border-2 border-input px-5 font-semibold hover:bg-muted">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <section className="mt-12" aria-labelledby="orders-h">
        <h2 id="orders-h" className="text-2xl font-bold">
          My orders
        </h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-lg text-muted-foreground">
            No orders yet.{" "}
            <Link href="/shop" className="font-semibold text-foreground underline underline-offset-4">
              Start shopping
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-3xl border">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-lg font-semibold">Order #{o.number}</p>
                  <p className="text-muted-foreground">
                    {formatDate(o.createdAt)} · {o._count.items} {o._count.items === 1 ? "item" : "items"} · {formatMoney(o.total, fmt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full px-3 py-1 font-semibold", ORDER_STATUS_TONE[o.status])}>{ORDER_STATUS_LABEL[o.status]}</span>
                  <Link href={`/order/confirmation?n=${o.number}&t=${encodeURIComponent(o.accessToken)}`} className="inline-flex h-11 items-center rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted">
                    View order
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-2" aria-labelledby="addr-h">
        <div>
          <h2 id="addr-h" className="text-2xl font-bold">
            Saved addresses
          </h2>
          {addresses.length === 0 ? (
            <p className="mt-4 text-lg text-muted-foreground">No saved addresses yet. Add one here, or tick “Save this address” at checkout.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {addresses.map((a) => (
                <li key={a.id} className="rounded-2xl border p-5">
                  <p className="font-semibold">
                    {a.label} {a.isDefault && <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-sm">Default</span>}
                  </p>
                  <p className="text-muted-foreground">
                    {a.name}, {a.phone}
                    <br />
                    {a.address}, {a.city}
                  </p>
                  <div className="mt-3 flex gap-3">
                    {!a.isDefault && (
                      <form action={makeDefaultAddress}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="font-semibold underline underline-offset-4">Make default</button>
                      </form>
                    )}
                    <form action={deleteAddress}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="font-semibold text-destructive underline underline-offset-4">Delete</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-3xl border p-6">
          <h3 className="mb-4 text-xl font-bold">Add an address</h3>
          <AddressForm />
        </div>
      </section>
    </div>
  );
}
