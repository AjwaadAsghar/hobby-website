import { NextResponse } from "next/server";
import { z } from "zod";
import { searchSuggestions } from "@/server/catalog";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ q: z.string().trim().min(1).max(100) });

export async function GET(req: Request) {
  const limit = rateLimit(`search:${clientIp(req.headers)}`, 120, 60_000);
  if (!limit.ok) return NextResponse.json({ results: [] }, { status: 429 });
  const parsed = schema.safeParse({ q: new URL(req.url).searchParams.get("q") ?? "" });
  if (!parsed.success) return NextResponse.json({ results: [] });
  const results = await searchSuggestions(parsed.data.q, 6);
  return NextResponse.json({
    results: results.map((r) => ({ id: r.id, slug: r.slug, title: r.title, price: r.price, image: r.image, brand: r.brand })),
  });
}
