"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

const schema = z
  .array(
    z.object({
      kind: z.enum(["product", "variant"]),
      id: z.string().min(1).max(40),
      productId: z.string().min(1).max(40),
      stock: z.number().int().min(0).max(1_000_000),
      threshold: z.number().int().min(0).max(10_000).optional(),
    }),
  )
  .max(500);

/** Saves inline stock edits. Sets absolute values (what you see is what is saved). */
export async function saveInventory(changes: unknown): Promise<{ ok?: boolean; error?: string; saved?: number }> {
  await requireAdmin();
  const parsed = schema.safeParse(changes);
  if (!parsed.success) return { error: "Stock must be a whole number of 0 or more." };
  await db.$transaction(async (tx) => {
    for (const c of parsed.data) {
      if (c.kind === "product") await tx.product.update({ where: { id: c.id }, data: { stock: c.stock } });
      else await tx.productVariant.update({ where: { id: c.id }, data: { stock: c.stock } });
      if (c.threshold !== undefined) await tx.product.update({ where: { id: c.productId }, data: { lowStockThreshold: c.threshold } });
    }
  });
  revalidatePath("/admin/inventory");
  return { ok: true, saved: parsed.data.length };
}
