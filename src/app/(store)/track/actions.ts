"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { findOrderForTracking } from "@/server/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

const schema = z.object({
  number: z.coerce
    .number({ message: "Please enter your order number, for example 10023." })
    .int("Order numbers are whole numbers, for example 10023.")
    .positive("Please enter your order number, for example 10023."),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Please enter the phone number you used when ordering."),
});

export type TrackState =
  | { status: "idle" }
  | { status: "error"; errors: { number?: string; phone?: string; form?: string }; values: { number: string; phone: string } }
  | {
      status: "found";
      phone: string;
      fmt: { currency: string; locale: string };
      order: PublicOrder;
    };

/** Only what the customer should see - never tokens or internal notes. */
function toPublic(o: NonNullable<Awaited<ReturnType<typeof findOrderForTracking>>>) {
  return {
    number: o.number,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    city: o.city,
    subtotal: o.subtotal,
    discountTotal: o.discountTotal,
    shippingTotal: o.shippingTotal,
    total: o.total,
    courierName: o.courierName,
    trackingNumber: o.trackingNumber,
    createdAt: o.createdAt,
    items: o.items.map((i) => ({ id: i.id, title: i.title, variantName: i.variantName, quantity: i.quantity, lineTotal: i.lineTotal, image: i.image })),
    history: o.history.map((h) => ({ status: h.status, createdAt: h.createdAt })),
  };
}
type PublicOrder = ReturnType<typeof toPublic>;

export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const values = { number: String(formData.get("number") ?? "").replace(/[^\d]/g, ""), phone: String(formData.get("phone") ?? "") };
  const ip = clientIp(await headers());
  if (!rateLimit(`track:${ip}`, 20, 10 * 60_000).ok) {
    return { status: "error", errors: { form: "Too many attempts. Please wait a few minutes and try again." }, values };
  }
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const errors: { number?: string; phone?: string } = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0] as "number" | "phone";
      errors[k] ??= i.message;
    }
    return { status: "error", errors, values };
  }
  const order = await findOrderForTracking(parsed.data.number, parsed.data.phone);
  if (!order) {
    return {
      status: "error",
      errors: { form: "We could not find an order with that number and phone number. Please check both and try again." },
      values,
    };
  }
  const s = await getSettings();
  return { status: "found", order: toPublic(order), phone: parsed.data.phone, fmt: { currency: s.commerce.currency, locale: s.commerce.locale } };
}
