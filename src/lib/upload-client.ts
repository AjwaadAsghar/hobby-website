"use client";

/** Uploads one file through the admin upload API. Returns the stored URL. */
export async function uploadFile(file: File, folder: string, kind: "image" | "model" = "image"): Promise<string> {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("folder", folder);
  fd.set("kind", kind);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return data.url;
}
