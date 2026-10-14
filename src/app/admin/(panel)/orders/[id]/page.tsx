import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone, Printer } from "lucide-react";
import { db } from "@/lib/db";
import { getMoneyFormat, getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatDate, normalizePhone, telLink, whatsappLink } from "@/lib/format";
import { paymentLabel } from "@/lib/payments/registry";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { Panel, PaymentBadge, StatusBadge } from "@/components/admin/badges";
import { ProductImage } from "@/components/store/product-image";
import { MarkPaid, NotesForm, PaymentReview, StatusForm } from "./order-forms";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id }, select: { number: true } });
  return { title: o ? `Order #${o.number}` : "Order" };
}

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const [order, fmt, s] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true, history: { orderBy: { createdAt: "desc" } }, user: { select: { email: true } } } }),
    getMoneyFormat(),
    getSettings(),
  ]);
  if (!order) notFound();
  const m = (n: number) => formatMoney(n, fmt);
  const previous = await db.order.count({ where: { phoneNormalized: order.phoneNormalized, id: { not: order.id } } });
  const waText = `Hi ${order.customerName.split(" ")[0]}, this is ${s.branding.storeName} about your order #${order.number}.`;

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All orders
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold">
            Order #{order.number} <StatusBadge status={order.status} /> <PaymentBadge status={order.paymentStatus} />
          </h1>
          <p className="mt-1 text-muted-foreground">Placed {formatDate(order.createdAt, true)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/admin/print/invoice/${order.id}`} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
            <Printer className="size-4" aria-hidden /> Invoice
          </a>
          <a href={`/admin/print/packing-slip/${order.id}`} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
            <Printer className="size-4" aria-hidden /> Packing slip
          </a>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <Panel title={`Items (${order.items.reduce((n, i) => n + i.quantity, 0)})`}>
            <ul className="divide-y">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-4 py-3">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <ProductImage src={it.image} alt="" sizes="64px" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {it.productId ? (
                      <Link href={`/admin/products/${it.productId}`} className="font-semibold hover:underline">
                        {it.title}
                      </Link>
                    ) : (
                      <p className="font-semibold">{it.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {[it.variantName, it.sku && `SKU ${it.sku}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="text-right tabular-nums">
                    {m(it.unitPrice)} × {it.quantity}
                    <span className="block font-semibold">{m(it.lineTotal)}</span>
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t pt-4">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{m(order.subtotal)}</dd>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount {order.discountCode && `(${order.discountCode})`}</dt>
                  <dd className="tabular-nums">−{m(order.discountTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Shipping {order.shippingZone && <span className="text-muted-foreground">({order.shippingZone})</span>}</dt>
                <dd className="tabular-nums">{order.shippingTotal ? m(order.shippingTotal) : "Free"}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-xl font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{m(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          {order.notes && (
            <Panel title="Customer notes">
              <p className="text-lg whitespace-pre-wrap">{order.notes}</p>
            </Panel>
          )}

          <Panel title="Timeline">
            <ol className="space-y-4">
              {order.history.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <span className="mt-2 size-2.5 shrink-0 rounded-full bg-foreground" aria-hidden />
                  <div>
                    <p className="font-semibold">
                      {ORDER_STATUS_LABEL[h.status] ?? h.status}
                      {h.note && <span className="font-normal"> - {h.note}</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(h.createdAt, true)} · by {h.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="text-lg font-semibold">{order.customerName}</p>
            {previous > 0 && <p className="text-sm text-muted-foreground">{previous} previous order{previous > 1 ? "s" : ""}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={telLink(order.phone)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-input font-semibold hover:bg-muted">
                <Phone className="size-4" aria-hidden /> Call
              </a>
              <a href={whatsappLink(normalizePhone(order.phone), waText)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b7a3e] font-semibold text-white">
                <MessageCircle className="size-4" aria-hidden /> WhatsApp
              </a>
            </div>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">Phone</dt>
                <dd>{order.phone}</dd>
              </div>
              {order.email && (
                <div>
                  <dt className="text-sm font-semibold text-muted-foreground">Email</dt>
                  <dd>
                    <a href={`mailto:${order.email}`} className="inline-flex items-center gap-1.5 break-all underline-offset-4 hover:underline">
                      <Mail className="size-4 shrink-0" aria-hidden /> {order.email}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">Delivery address</dt>
                <dd>
                  {order.address}
                  <br />
                  <strong>{order.city}</strong>
                </dd>
              </div>
              {order.user && (
                <div>
                  <dt className="text-sm font-semibold text-muted-foreground">Account</dt>
                  <dd>{order.user.email}</dd>
                </div>
              )}
            </dl>
          </Panel>

          <Panel title="Payment">
            <p className="font-semibold">{paymentLabel(order.paymentMethod)}</p>
            <div className="mt-1">
              <PaymentBadge status={order.paymentStatus} />
            </div>
            {order.paymentProofUrl && (
              <div className="mt-4">
                <p className="mb-2 font-semibold">Payment screenshot</p>
                <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="relative block aspect-[3/4] overflow-hidden rounded-xl border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.paymentProofUrl} alt={`Payment screenshot for order ${order.number}`} className="h-full w-full object-contain" />
                </a>
                <p className="mt-1 text-sm text-muted-foreground">Click to open full size. Check the amount ({m(order.total)}) and date.</p>
              </div>
            )}
            {order.paymentStatus === "AWAITING_VERIFICATION" && (
              <div className="mt-4 border-t pt-4">
                <PaymentReview orderId={order.id} />
              </div>
            )}
            {["AWAITING_PAYMENT", "REJECTED", "UNPAID"].includes(order.paymentStatus) && (
              <div className="mt-4 border-t pt-4">
                <MarkPaid orderId={order.id} />
              </div>
            )}
          </Panel>

          <Panel title="Fulfilment">
            {(order.courierName || order.trackingNumber) && (
              <p className="mb-4 rounded-xl bg-muted p-3">
                {order.courierName} {order.trackingNumber && <span className="font-mono">· {order.trackingNumber}</span>}
              </p>
            )}
            <StatusForm orderId={order.id} status={order.status} courierName={order.courierName ?? ""} trackingNumber={order.trackingNumber ?? ""} />
          </Panel>

          <Panel title="Internal notes">
            <NotesForm orderId={order.id} notes={order.internalNotes} />
          </Panel>
        </div>
      </div>
    </>
  );
}
