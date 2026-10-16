import fs from "node:fs/promises";
import path from "node:path";
import { LOCAL_UPLOAD_DIR } from "@/server/storage";
import { getAdmin } from "@/lib/auth-helpers";
import { integrations } from "@/server/integration-log";
import { PRIVATE_BUCKET, supabaseDownload } from "@/server/supabase-storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  glb: "model/gltf-binary",
};

/**
 * Serves files saved by the local upload fallback, and payment screenshots kept
 * in Supabase's private bucket. Payment screenshots are admin-only.
 */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  if (!parts.length || parts.some((p) => !/^[a-z0-9-]+(\.[a-z0-9]+)?$/i.test(p))) {
    return new Response("Not found", { status: 404 });
  }
  if (parts[0] === "payment-proofs" && !(await getAdmin())) {
    return new Response("Not allowed", { status: 403 });
  }
  const file = path.join(LOCAL_UPLOAD_DIR, ...parts);
  if (!file.startsWith(LOCAL_UPLOAD_DIR)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(file, parts);
    if (!data) return new Response("Not found", { status: 404 });
    const ext = path.extname(file).slice(1).toLowerCase();
    return new Response(data, {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": parts[0] === "payment-proofs" ? "private, no-store" : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

/** Local file first; payment screenshots may instead live in Supabase's private bucket. */
async function readFile(file: string, parts: string[]): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    return new Uint8Array(await fs.readFile(file));
  } catch {
    if (parts[0] === "payment-proofs" && integrations.supabase()) return supabaseDownload(PRIVATE_BUCKET, parts.join("/"));
    return null;
  }
}
