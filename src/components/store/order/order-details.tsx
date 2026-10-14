import { Check } from "lucide-react";
import { formatMoney, type MoneyFormat } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { paymentLabel } from "@/lib/payments/registry";
import { ORDER_FLOW, ORDER_STATUS_CUSTOMER, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-status";
import { ProductImage } from "@/components/store/product-image";
import { cn } from "@/lib/utils";

type Order = {
  number: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  courierName: string | null;
  trackingNumber: string | null;
  createdAt: Date;
  items: { id: string; title: string; variantName: string | null; quantity: number; lineTotal: number; image: string | null }[];
  history?: { status: string; createdAt: Date }[];
};

export function OrderProgress({ order }: { order: Order }) {
  const cancelled = order.status === "CANCELLED" || order.status === "RETURNED";
  const reached = ORDER_FLOW.indexOf(order.status as (typeof ORDER_FLOW)[number]);
  const when = (s: string) => order.history?.filter((h) => h.status === s).at(-1)?.createdAt;
  return (
    <div>
      <p className="text-2xl font-bold">{ORDER_STATUS_LABEL[order.status] ?? order.status}</p>
      <p className="mt-1 text-lg text-muted-foreground">{ORDER_STATUS_CUSTOMER[order.status]}</p>
      {!cancelled && (
        <ol className="mt-6 space-y-0">
          {ORDER_FLOW.map((s, i) => {
            const done = i <= reached;
            const date = when(s);
            return (
              <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                {i < ORDER_FLOW.length - 1 && <span aria-hidden className={cn("absolute top-10 left-[19px] h-[calc(100%-2.5rem)] w-0.5", i < reached ? "bg-success" : "bg-border")} />}
                <span
                  className={cn(
                    "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-bold",
                    done ? "border-success bg-success text-white" : "border-input bg-background text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-5" aria-hidden /> : i + 1}
                </span>
                <span className="pt-1.5">
                  <span className={cn("block text-lg font-semibold", !done && "text-muted-foreground")}>
                    {ORDER_STATUS_LABEL[s]}
                    <span className="sr-only">{done ? " - done" : " - not yet"}</span>
                  </span>
                  {date && <span className="block text-[0.95rem] text-muted-foreground">{formatDate(date, true)}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {order.status === "SHIPPED" && (order.courierName || order.trackingNumber) && (
        <div className="mt-6 rounded-2xl bg-muted p-4 text-lg">
          {order.courierName && (
            <p>
              <strong>Courier:</strong> {order.courierName}
            </p>
          )}
          {order.trackingNumber && (
            <p>
              <strong>Tracking number:</strong> <span className="font-mono">{order.trackingNumber}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function OrderSummaryCard({ order, fmt }: { order: Order; fmt: MoneyFormat }) {
  const m = (n: number) => formatMoney(n, fmt);
  return (
    <div className="space-y-5 rounded-3xl border p-6">
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="text-2xl font-bold">Order #{order.number}</h2>
        <p className="text-muted-foreground">Placed {formatDate(order.createdAt, true)}</p>
      </div>
      <ul className="divide-y">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-center gap-4 py-3">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              <ProductImage src={it.image} alt="" sizes="64px" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">
                {it.quantity} × {it.title}
              </span>
              {it.variantName && <span className="block text-muted-foreground">{it.variantName}</span>}
            </span>
            <span className="font-semibold">{m(it.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1.5 text-lg">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{m(order.subtotal)}</dd>
        </div>
        {order.discountTotal > 0 && (
          <div className="flex justify-between text-success">
            <dt>Discount</dt>
            <dd>−{m(order.discountTotal)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd>{order.shippingTotal ? m(order.shippingTotal) : "Free"}</dd>
        </div>
        <div className="flex justify-between border-t pt-2 text-xl font-bold">
          <dt>Total</dt>
          <dd>{m(order.total)}</dd>
        </div>
      </dl>
      <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
        <div>
          <p className="font-semibold">Delivery address</p>
          <p className="text-muted-foreground">
            {order.customerName}
            <br />
            {order.phone}
            <br />
            {order.address}, {order.city}
          </p>
        </div>
        <div>
          <p className="font-semibold">Payment</p>
          <p className="text-muted-foreground">
            {paymentLabel(order.paymentMethod)}
            <br />
            {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
          </p>
        </div>
      </div>
    </div>
  );
}
