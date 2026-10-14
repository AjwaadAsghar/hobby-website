"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { sanitizeRichText } from "@/lib/sanitize";
import { defaultPages } from "@/config/default-pages";

const schema = z.object({
  slug: z.enum(Object.keys(defaultPages) as [string, ...string[]]),
  title: z.string().trim().min(1, "Please enter a title.").max(120),
  content: z.string().max(100_000),
});

export async function savePage(input: unknown): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the page." };
  const { slug, title } = parsed.data;
  const content = sanitizeRichText(parsed.data.content);
  await db.page.upsert({ where: { slug }, create: { slug, title, content }, update: { title, content } });
  revalidatePath(`/${slug}`);
  return { ok: true };
}

export async function resetPage(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug"));
  const def = defaultPages[slug];
  if (!def) return;
  await db.page.upsert({ where: { slug }, create: { slug, ...def }, update: def });
  revalidatePath(`/admin/pages/${slug}`);
  revalidatePath(`/${slug}`);
}
