import { NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth-helpers";
import { storeUpload, UploadError } from "@/server/storage";

const FOLDERS = new Set(["products", "models", "branding", "banners", "categories"]);

/** Admin uploads: product photos, GLB models, logo, favicon, banners. */
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folder = String(form?.get("folder") ?? "products");
  const kind = form?.get("kind") === "model" ? "model" : "image";
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (!FOLDERS.has(folder)) return NextResponse.json({ error: "Invalid folder." }, { status: 400 });
  try {
    const { url } = await storeUpload(file, { folder, kind });
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
