import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { integrations, logIntegration } from "@/server/integration-log";
import { PRIVATE_BUCKET, PUBLIC_BUCKET, supabasePublicUrl, supabaseUpload } from "@/server/supabase-storage";

/** Local fallback folder (served by src/app/media/[...path]/route.ts). */
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");

export type UploadKind = "image" | "model";

export class UploadError extends Error {}

const LIMITS: Record<UploadKind, number> = { image: 8 * 1024 * 1024, model: 25 * 1024 * 1024 };

/** Checks the real file contents (magic bytes), not just the name. */
function detectType(buf: Buffer): { ext: string; mime: string; kind: UploadKind } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg", kind: "image" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", mime: "image/png", kind: "image" };
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { ext: "webp", mime: "image/webp", kind: "image" };
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return { ext: "gif", mime: "image/gif", kind: "image" };
  if (buf.subarray(4, 12).toString("ascii").startsWith("ftypavif")) return { ext: "avif", mime: "image/avif", kind: "image" };
  if (buf.subarray(0, 4).toString("ascii") === "glTF") return { ext: "glb", mime: "model/gltf-binary", kind: "model" };
  return null;
}

/**
 * Saves an upload to Cloudinary or Supabase Storage when one is configured,
 * otherwise to the local uploads/ folder (fine locally; on Vercel the disk is
 * temporary, so use one of the two). Payment screenshots in Supabase go to a
 * private bucket and are served to admins only through /media/payment-proofs/…
 */
export async function storeUpload(file: File, opts: { folder: string; kind: UploadKind }): Promise<{ url: string }> {
  if (!file || typeof file.arrayBuffer !== "function") throw new UploadError("No file was received.");
  if (file.size > LIMITS[opts.kind]) {
    throw new UploadError(opts.kind === "image" ? "That image is too large. Please use one under 8 MB." : "That 3D model is too large. Please use one under 25 MB.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const type = detectType(buf);
  if (!type || type.kind !== opts.kind) {
    throw new UploadError(opts.kind === "image" ? "Please upload a photo (JPG, PNG, WEBP or GIF)." : "Please upload a .glb 3D model file.");
  }
  const folder = opts.folder.replace(/[^a-z0-9-]/gi, "");
  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;

  if (integrations.cloudinary()) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `store/${folder}`, public_id: name, resource_type: type.kind === "model" ? "raw" : "image", ...(type.kind === "model" ? { format: "glb" } : {}) },
          (err, res) => (err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res as { secure_url: string })),
        );
        stream.end(buf);
      });
      await logIntegration("storage", "OK", `Uploaded ${folder}/${name}.${type.ext} to Cloudinary`);
      return { url: result.secure_url };
    } catch (err) {
      await logIntegration("storage", "FAILED", `Cloudinary upload failed, trying the next option: ${(err as Error).message}`);
    }
  }

  if (integrations.supabase()) {
    const objectPath = `${folder}/${name}.${type.ext}`;
    const isPrivate = folder === "payment-proofs";
    try {
      await supabaseUpload(isPrivate ? PRIVATE_BUCKET : PUBLIC_BUCKET, objectPath, buf, type.mime);
      await logIntegration("storage", "OK", `Uploaded ${objectPath} to Supabase Storage`);
      return { url: isPrivate ? `/media/${objectPath}` : supabasePublicUrl(objectPath) };
    } catch (err) {
      await logIntegration("storage", "FAILED", `Supabase upload failed, saving locally instead: ${(err as Error).message}`);
    }
  }

  const dir = path.join(LOCAL_UPLOAD_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${name}.${type.ext}`), buf);
  return { url: `/media/${folder}/${name}.${type.ext}` };
}
