"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { toMinor } from "@/lib/money";

const zoneSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(1, "Give the zone a name.").max(60),
  cities: z.array(z.string().trim().min(1).max(60)).max(500),
  rate: z.coerce.number().min(0, "Rate cannot be negative.").max(1_000_000),
  isDefault: z.boolean(),
});

const listSchema = z.array(zoneSchema).max(100);

/** Replaces all shipping zones with the edited list. Exactly one default zone is kept. */
export async function saveZones(input: unknown): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const parsed = listSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the zones." };
  const zones = parsed.data;
  if (zones.filter((z) => z.isDefault).length !== 1) return { error: "Choose exactly one zone as “All other cities”." };
  const seen = new Map<string, string>();
  for (const z of zones) {
    for (const c of z.cities) {
      const k = c.toLowerCase();
      if (seen.has(k)) return { error: `"${c}" is listed in both “${seen.get(k)}” and “${z.name}”.` };
      seen.set(k, z.name);
    }
  }
  await db.$transaction(async (tx) => {
    const keep = zones.map((z) => z.id).filter((x): x is string => !!x);
    await tx.shippingZone.deleteMany({ where: { id: { notIn: keep } } });
    for (const [i, z] of zones.entries()) {
      const data = { name: z.name, cities: JSON.stringify(z.isDefault ? [] : z.cities), rate: toMinor(z.rate), isDefault: z.isDefault, sortOrder: i };
      if (z.id) await tx.shippingZone.update({ where: { id: z.id }, data });
      else await tx.shippingZone.create({ data });
    }
  });
  revalidatePath("/admin/shipping");
  return { ok: true };
}
