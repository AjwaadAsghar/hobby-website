import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getPaymentProvider } from "@/lib/payments/registry";
import { CheckoutSteps } from "@/components/store/checkout-steps";
import { OrderSummaryCard } from "@/components/store/order/order-details";
import { ProofUpload } from "@/components/store/order/proof-upload";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function ConfirmationPage({ searchParams }: PageProps<"/order/confirmation">) {
  const sp = await searchParams;
  const number = Number(sp.n);
  const token = typeof sp.t === "string" ? sp.t : "";
  if (!number || !token) notFound();
  const [order, s] = await Promise.all([
    db.order.findUnique({ where: { number }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order || order.accessToken !== token) notFound();

  const fmt = { currency: s.commerce.currency, locale: s.commerce.locale };
  const provider = getPaymentProvider(order.paymentMethod);
  const info = provider?.publicInfo(s);
  const needsPayment = info?.kind === "manual_proof" && (order.paymentStatus === "AWAITING_PAYMENT" || order.paymentStatus === "REJECTED");
  const waitingVerification = order.paymentStatus === "AWAITING_VERIFICATION";

  return (
    <div className="container-store max-w-4xl py-10">
      <CheckoutSteps current={4} />
      <div className="rounded-3xl bg-success/10 p-8 text-center">
        <CheckCircle2 className="mx-auto size-16 text-success" aria-hidden />
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Thank you, {order.customerName.split(" ")[0]}!</h1>
        <p className="mt-3 text-xl">Your order has been placed.</p>
        <p className="mt-4 text-lg">Your order number is</p>
        <p className="mt-1 text-5xl font-black tracking-wider">#{order.number}</p>
        <p className="mt-4 text-lg text-muted-foreground">
          Please keep this number. We will call or message you on <strong className="text-foreground">{order.phone}</strong> to confirm.
          {order.email && (
            <>
              {" "}
              A confirmation email is on its way to <strong className="text-foreground">{order.email}</strong>.
            </>
          )}
        </p>
      </div>

      {needsPayment && info && (
        <section className="mt-8 rounded-3xl border-2 border-warning/60 bg-warning/5 p-6" aria-labelledby="pay-now">
          <h2 id="pay-now" className="text-2xl font-bold">
            One more step: send your payment
          </h2>
          <p className="mt-2 text-lg">{info.instructions}</p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {info.details.map((d) => (
              <div key={d.label} className="rounded-xl bg-background px-4 py-3">
                <dt className="text-sm text-muted-foreground">{d.label}</dt>
                <dd className="text-lg font-semibold">{d.value}</dd>
              </div>
            ))}
            <div className="rounded-xl bg-background px-4 py-3">
              <dt className="text-sm text-muted-foreground">Amount</dt>
              <dd className="text-lg font-bold">{formatMoney(order.total, fmt)}</dd>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <dt className="text-sm text-muted-foreground">Reference</dt>
              <dd className="text-lg font-semibold">Order #{order.number}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <ProofUpload number={order.number} token={order.accessToken} />
          </div>
        </section>
      )}
      {waitingVerification && (
        <p className="mt-8 rounded-2xl bg-muted p-5 text-lg">
          We have your payment screenshot. Your order will show <strong>“Awaiting payment verification”</strong> until we confirm the money has arrived.
        </p>
      )}

      <div className="mt-8">
        <OrderSummaryCard order={order} fmt={fmt} />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={`/track?order=${order.number}`} className="inline-flex h-14 flex-1 items-center justify-center rounded-xl bg-foreground text-lg font-semibold text-background">
          Track my order
        </Link>
        <Link href="/shop" className="inline-flex h-14 flex-1 items-center justify-center rounded-xl border-2 border-foreground text-lg font-semibold">
          Continue shopping
        </Link>
        {s.contact.whatsapp && (
          <a
            href={whatsappLink(s.contact.whatsapp, `Hi, I just placed order #${order.number}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-input text-lg font-semibold"
          >
            <MessageCircle className="size-5" aria-hidden /> Message us
          </a>
        )}
      </div>
    </div>
  );
}
