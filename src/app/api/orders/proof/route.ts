import { NextResponse, after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/format";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { storeUpload, UploadError } from "@/server/storage";
import { notifyPaymentProof } from "@/server/notify";

const schema = z.object({
  number: z.coerce.number().int().positive(),
  token: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
});

/** Customer uploads a payment screenshot (bank transfer / JazzCash / Easypaisa). */
export async function POST(req: Request) {
  if (!rateLimit(`proof:${clientIp(req.headers)}`, 10, 10 * 60_000).ok) {
    return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Please choose a screenshot to upload." }, { status: 400 });
  const parsed = schema.safeParse({
    number: form.get("number"),
    token: form.get("token") || undefined,
    phone: form.get("phone") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Order details are missing." }, { status: 400 });

  const order = await db.order.findUnique({ where: { number: parsed.data.number } });
  const tokenOk = order && parsed.data.token && parsed.data.token === order.accessToken;
  const phoneOk = order && parsed.data.phone && normalizePhone(parsed.data.phone).slice(-10) === order.phoneNormalized.slice(-10);
  if (!order || (!tokenOk && !phoneOk)) {
    return NextResponse.json({ error: "We could not find that order." }, { status: 404 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "This order is already marked as paid. No need to upload anything." }, { status: 400 });
  }
  if (order.paymentMethod === "cod") {
    return NextResponse.json({ error: "This order is cash on delivery, so no screenshot is needed." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Please choose a screenshot to upload." }, { status: 400 });
  }
  try {
    const { url } = await storeUpload(file, { folder: "payment-proofs", kind: "image" });
    await db.order.update({ where: { id: order.id }, data: { paymentProofUrl: url, paymentStatus: "AWAITING_VERIFICATION" } });
    await db.orderStatusHistory.create({ data: { orderId: order.id, status: order.status, note: "Payment screenshot uploaded", actor: "customer" } });
    after(() => notifyPaymentProof(order.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[proof] upload failed", err);
    return NextResponse.json({ error: "The upload did not work. Please try again, or send the screenshot on WhatsApp." }, { status: 500 });
  }
}
