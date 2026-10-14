import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Please enter a valid email address, like name@example.com.").max(200) });

export async function POST(req: Request) {
  if (!rateLimit(`newsletter:${clientIp(req.headers)}`, 5, 10 * 60_000).ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Please enter a valid email address." }, { status: 400 });
  }
  await db.newsletterSubscriber.upsert({ where: { email: parsed.data.email }, create: { email: parsed.data.email }, update: {} });
  return NextResponse.json({ ok: true });
}
