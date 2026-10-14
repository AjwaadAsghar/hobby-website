/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { requireAdminPage } from "@/lib/auth-helpers";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { paymentLabel } from "@/lib/payments/registry";
import { PAYMENT_STATUS_LABEL } from "@/lib/order-status";
import { PrintButton } from "./print-button";

/** Printable invoice / packing slip. Branding always comes from current settings. */
export async function PrintDocument({ id, kind }: { id: string; kind: "invoice" | "packing-slip" }) {
  await requireAdminPage();
  const [order, s] = await Promise.all([db.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  const fmt = { currency: s.commerce.currency, locale: s.commerce.locale };
  const m = (n: number) => formatMoney(n, fmt);
  const invoice = kind === "invoice";
  const cod = order.paymentMethod === "cod" && order.paymentStatus !== "PAID";

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="no-print sticky top-0 flex items-center justify-between gap-3 border-b bg-zinc-100 px-6 py-3">
        <p className="font-semibold">
          {invoice ? "Invoice" : "Packing slip"} for order #{order.number}
        </p>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-3xl p-8 text-[15px] leading-relaxed">
        <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-6">
          <div>
            {s.branding.logoUrl ? (
              <img src={s.branding.logoUrl} alt={s.branding.storeName} className="h-12 w-auto" />
            ) : (
              <p className="text-3xl font-extrabold">{s.branding.storeName}</p>
            )}
            <p className="mt-2 max-w-xs text-zinc-700">{s.contact.address}</p>
            <p className="text-zinc-700">
              {s.contact.phone}
              {s.contact.email && ` · ${s.contact.email}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-wide uppercase">{invoice ? "Invoice" : "Packing slip"}</p>
            <p className="mt-1">
              Order <strong>#{order.number}</strong>
            </p>
            <p>{formatDate(order.createdAt)}</p>
            {invoice && <p>{PAYMENT_STATUS_LABEL[order.paymentStatus]}</p>}
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-bold tracking-wide text-zinc-600 uppercase">Deliver to</p>
            <p className="mt-1 text-lg font-semibold">{order.customerName}</p>
            <p>{order.phone}</p>
            <p>{order.address}</p>
            <p className="font-semibold">{order.city}</p>
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-zinc-600 uppercase">Payment</p>
            <p className="mt-1">{paymentLabel(order.paymentMethod)}</p>
            {cod && (
              <p className="mt-2 inline-block rounded border-2 border-black px-3 py-1 text-lg font-bold">Collect cash: {m(order.total)}</p>
            )}
            {order.courierName && (
              <p className="mt-2">
                Courier: {order.courierName} {order.trackingNumber && `· ${order.trackingNumber}`}
              </p>
            )}
          </div>
        </section>

        <table className="mt-8 w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-black">
              {!invoice && <th className="w-10 py-2">✓</th>}
              <th className="py-2">Item</th>
              <th className="py-2">SKU</th>
              <th className="py-2 text-right">Qty</th>
              {invoice && <th className="py-2 text-right">Price</th>}
              {invoice && <th className="py-2 text-right">Total</th>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-b border-zinc-300">
                {!invoice && (
                  <td className="py-2">
                    <span className="inline-block size-5 border-2 border-black" />
                  </td>
                )}
                <td className="py-2">
                  {it.title}
                  {it.variantName && <span className="block text-zinc-600">{it.variantName}</span>}
                </td>
                <td className="py-2 text-zinc-700">{it.sku ?? "-"}</td>
                <td className="py-2 text-right font-semibold">{it.quantity}</td>
                {invoice && <td className="py-2 text-right">{m(it.unitPrice)}</td>}
                {invoice && <td className="py-2 text-right">{m(it.lineTotal)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {invoice ? (
          <dl className="mt-6 ml-auto w-72 space-y-1">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{m(order.subtotal)}</dd>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between">
                <dt>Discount {order.discountCode && `(${order.discountCode})`}</dt>
                <dd>−{m(order.discountTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{order.shippingTotal ? m(order.shippingTotal) : "Free"}</dd>
            </div>
            <div className="flex justify-between border-t-2 border-black pt-2 text-lg font-bold">
              <dt>Total</dt>
              <dd>{m(order.total)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-6">
            Total items: <strong>{order.items.reduce((n, i) => n + i.quantity, 0)}</strong>
          </p>
        )}

        {order.notes && (
          <p className="mt-8 rounded border border-zinc-400 p-3">
            <strong>Customer notes:</strong> {order.notes}
          </p>
        )}
        <footer className="mt-12 border-t pt-4 text-center text-zinc-600">
          Thank you for shopping with {s.branding.storeName}!{s.contact.whatsapp && ` Questions? WhatsApp us on +${s.contact.whatsapp.replace(/\D/g, "")}.`}
        </footer>
      </div>
    </div>
  );
}
