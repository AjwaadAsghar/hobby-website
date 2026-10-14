import { NextResponse, after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { sendEmail, getEmailBrand } from "@/server/email/send";
import { SimpleEmail } from "@/emails/order-emails";

const schema = z
  .object({
    name: z.string().trim().min(2, "Please tell us your name.").max(80),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => !v || z.string().email().safeParse(v).success, "Please check your email address.")
      .optional()
      .default(""),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine((v) => !v || v.replace(/\D/g, "").length >= 10, "Please check your phone number, e.g. 0300 1234567.")
      .optional()
      .default(""),
    message: z.string().trim().min(5, "Please write a short message.").max(3000, "Please keep your message under 3000 characters."),
    website: z.string().optional(),
  })
  .refine((d) => d.email || d.phone, { message: "Please give us a phone number or email so we can reply.", path: ["phone"] });

export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req.headers)}`, 5, 15 * 60_000).ok) {
    return NextResponse.json({ ok: false, error: "You have sent several messages already. Please wait a little, or message us on WhatsApp." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0] ?? "form")] ??= i.message;
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // bot
  const msg = await db.contactMessage.create({ data: { name: d.name, email: d.email || null, phone: d.phone || null, message: d.message } });
  await db.adminNotification.create({
    data: { type: "CONTACT", title: `Message from ${d.name}`, body: d.message.slice(0, 140), link: "/admin/customers?tab=messages" },
  });
  after(async () => {
    const s = await getSettings();
    if (!s.notifications.ownerEmail) return;
    await sendEmail({
      to: s.notifications.ownerEmail,
      subject: `New contact message from ${d.name}`,
      replyTo: d.email || undefined,
      react: <SimpleEmail brand={await getEmailBrand()} title={`Message from ${d.name}`} body={`${d.message}\n\nPhone: ${d.phone || "-"}\nEmail: ${d.email || "-"}\nRef: ${msg.id}`} />,
    });
  });
  return NextResponse.json({ ok: true });
}
