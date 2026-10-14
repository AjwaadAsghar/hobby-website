import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteCart } from "@/server/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(40),
        variantId: z.string().min(1).max(40).nullable(),
        qty: z.number().int().min(0).max(99),
      }),
    )
    .max(50),
  discountCode: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientIp(req.headers)}`, 120, 60_000).ok) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  const { discountId: _ignored, ...quote } = await quoteCart(parsed.data);
  void _ignored;
  return NextResponse.json(quote);
}
