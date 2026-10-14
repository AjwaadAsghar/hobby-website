import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { AuthError, requireAdmin } from "@/lib/auth-helpers";

function deny(err: unknown) {
  if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
  throw err;
}

/** Polled by the bell icon every few seconds. */
export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return deny(e);
  }
  const [unread, items] = await Promise.all([
    db.adminNotification.count({ where: { isRead: false } }),
    db.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return NextResponse.json(
    { unread, items: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

const markSchema = z.object({ ids: z.array(z.string().max(40)).max(100).optional(), all: z.boolean().optional() });

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return deny(e);
  }
  const parsed = markSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (parsed.data.all) await db.adminNotification.updateMany({ where: { isRead: false }, data: { isRead: true } });
  else if (parsed.data.ids?.length) await db.adminNotification.updateMany({ where: { id: { in: parsed.data.ids } }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
