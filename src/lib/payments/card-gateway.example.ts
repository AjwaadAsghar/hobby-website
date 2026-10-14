/**
 * EXAMPLE ONLY - not registered. Shows how a card gateway (Safepay, PayFast,
 * etc.) plugs into checkout without changing it.
 *
 * Steps to go live with a real gateway:
 *  1. Copy this file to e.g. safepay.ts and fill in the API calls from the
 *     gateway's documentation.
 *  2. Add its keys to .env (e.g. SAFEPAY_API_KEY) and a toggle in settings.
 *  3. Add it to `paymentProviders` in registry.ts.
 *  4. Create a route at src/app/api/payments/<id>/callback/route.ts that calls
 *     `verifyCallback` and marks the order PAID (see markOrderPaid in
 *     src/server/orders.ts).
 */
import type { PaymentProvider } from "./types";

export const exampleCardGateway: PaymentProvider = {
  id: "card",
  kind: "redirect",
  initialPaymentStatus: "AWAITING_PAYMENT",
  isEnabled: () => false,
  publicInfo: () => ({
    id: "card",
    label: "Debit / credit card",
    description: "Pay securely by card on the next page.",
    kind: "redirect",
    instructions: "",
    details: [],
  }),
  async initiate(order, ctx) {
    // const session = await fetch("https://api.gateway.example/v1/sessions", {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${process.env.GATEWAY_API_KEY}` },
    //   body: JSON.stringify({ amount: order.total, currency: order.currency, reference: order.number, success_url: ctx.returnUrl, cancel_url: ctx.cancelUrl }),
    // }).then((r) => r.json());
    // return { redirectUrl: session.checkout_url };
    void order;
    return { redirectUrl: ctx.cancelUrl };
  },
  async verifyCallback(request) {
    // Verify the gateway's signature header before trusting anything!
    const body = (await request.json()) as { reference: string; status: string; id: string };
    return { orderNumber: Number(body.reference), paid: body.status === "paid", reference: body.id };
  },
};
