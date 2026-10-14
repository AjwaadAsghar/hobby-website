"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { toMinor } from "@/lib/money";

export type DiscountState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const schema = z
  .object({
    id: z.string().max(40).optional(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Codes need at least 3 characters.")
      .max(30)
      .regex(/^[A-Z0-9_-]+$/, "Use only letters, numbers, - and _ (no spaces)."),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().positive("Please enter an amount above 0."),
    minOrder: z.coerce.number().min(0).default(0),
    expiresAt: z.string().optional().default(""),
    usageLimit: z.string().optional().default(""),
    isActive: z.string().optional(),
  })
  .refine((d) => d.type !== "PERCENT" || d.value <= 100, { message: "A percentage can be at most 100.", path: ["value"] });

export async function saveDiscount(_prev: DiscountState, formData: FormData): Promise<DiscountState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const d = parsed.data;
  const limit = d.usageLimit.trim() ? Math.floor(Number(d.usageLimit)) : null;
  if (limit !== null && (!Number.isFinite(limit) || limit < 1)) return { fieldErrors: { usageLimit: "Use a whole number, or leave empty for unlimited." } };
  const data = {
    code: d.code,
    type: d.type,
    value: d.type === "PERCENT" ? Math.round(d.value) : toMinor(d.value),
    minOrder: toMinor(d.minOrder),
    expiresAt: d.expiresAt ? new Date(`${d.expiresAt}T23:59:59`) : null,
    usageLimit: limit,
    isActive: d.isActive === "on",
  };
  try {
    if (d.id) await db.discountCode.update({ where: { id: d.id }, data });
    else await db.discountCode.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { fieldErrors: { code: "That code already exists." } };
    throw err;
  }
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function deleteDiscount(formData: FormData) {
  await requireAdmin();
  await db.discountCode.delete({ where: { id: String(formData.get("id")) } }).catch(() => null);
  revalidatePath("/admin/discounts");
}

export async function toggleDiscount(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const d = await db.discountCode.findUnique({ where: { id } });
  if (d) await db.discountCode.update({ where: { id }, data: { isActive: !d.isActive } });
  revalidatePath("/admin/discounts");
}
