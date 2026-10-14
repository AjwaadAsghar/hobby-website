"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { slugify } from "@/lib/format";

const schema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(1, "Please enter a name.").max(60),
  slug: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(300).default(""),
  image: z.string().max(1000).default(""),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});

export async function saveCategory(input: unknown): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  const data = { name: d.name, slug: slugify(d.slug || d.name), description: d.description, image: d.image || null, sortOrder: d.sortOrder, isActive: d.isActive };
  try {
    if (d.id) await db.category.update({ where: { id: d.id }, data });
    else await db.category.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { error: "Another category already uses that web address (slug)." };
    throw err;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  // Products in this category are kept and simply become "uncategorised".
  await db.category.delete({ where: { id: String(formData.get("id")) } }).catch(() => null);
  revalidatePath("/", "layout");
}
