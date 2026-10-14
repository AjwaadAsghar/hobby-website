import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { AuthError, requireAdmin } from "@/lib/auth-helpers";

const subSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

async function guard() {
  try {
    return { user: await requireAdmin() };
  } catch (e) {
    if (e instanceof AuthError) return { res: NextResponse.json({ error: e.message }, { status: e.status }) };
    throw e;
  }
}

/** Saves this device's push subscription for the signed-in admin. */
export async function POST(req: Request) {
  const g = await guard();
  if (g.res) return g.res;
  const parsed = subSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: g.user.id },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: g.user.id },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g.res) return g.res;
  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (endpoint) await db.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
