import "server-only";

/**
 * Minimal Supabase Storage client over its REST API (no extra package).
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the secret/service_role
 * key - server only, never sent to browsers).
 *
 * Buckets are created automatically on first use:
 *  - "store"          public: product photos, logos, 3D models
 *  - "store-private"  private: payment screenshots, served to admins through /media
 */
export const PUBLIC_BUCKET = "store";
export const PRIVATE_BUCKET = "store-private";

function config() {
  // Tolerate a pasted ".../rest/v1/" endpoint: only the project origin is needed.
  const raw = (process.env.SUPABASE_URL ?? "").trim();
  const url = raw.replace(/\/(rest|storage)\/v1.*$/, "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return { url, key };
}

/** New-style keys (sb_secret_…) go in `apikey` only; legacy service_role JWTs also as a Bearer token. */
function authHeaders(): Record<string, string> {
  const { key } = config();
  return key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

const ensured = new Set<string>();

async function ensureBucket(bucket: string, isPublic: boolean) {
  if (ensured.has(bucket)) return;
  const { url } = config();
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ id: bucket, name: bucket, public: isPublic }),
  });
  // 200 = created; 400/409 = it already exists. Anything else is a real problem.
  if (!res.ok && res.status !== 400 && res.status !== 409) {
    throw new Error(`Could not create storage bucket "${bucket}" (${res.status}): ${await res.text()}`);
  }
  ensured.add(bucket);
}

export async function supabaseUpload(bucket: string, objectPath: string, data: Buffer, contentType: string): Promise<void> {
  const { url } = config();
  await ensureBucket(bucket, bucket === PUBLIC_BUCKET);
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": contentType, "Cache-Control": "31536000", "x-upsert": "false" },
    body: new Uint8Array(data),
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
}

export function supabasePublicUrl(objectPath: string): string {
  return `${config().url}/storage/v1/object/public/${PUBLIC_BUCKET}/${objectPath}`;
}

/** Reads a file from the private bucket (null if missing). */
export async function supabaseDownload(bucket: string, objectPath: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const { url } = config();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}
