"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function userId() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Please sign in again.");
  return s.user.id;
}

const addressSchema = z.object({
  label: z.string().trim().min(1, "Give this address a name, like Home or Office.").max(30),
  name: z.string().trim().min(2, "Please enter the name for delivery.").max(80),
  phone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 10, "Please enter a valid phone number."),
  address: z.string().trim().min(8, "Please enter the full address.").max(300),
  city: z.string().trim().min(2, "Please enter the city.").max(60),
});

export type AddressState = { ok?: boolean; fieldErrors?: Record<string, string> };

export async function addAddress(_prev: AddressState, formData: FormData): Promise<AddressState> {
  const uid = await userId();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const count = await db.address.count({ where: { userId: uid } });
  if (count >= 10) return { fieldErrors: { label: "You can save up to 10 addresses." } };
  await db.address.create({ data: { ...parsed.data, userId: uid, isDefault: count === 0 } });
  revalidatePath("/account");
  return { ok: true };
}

export async function deleteAddress(formData: FormData) {
  const uid = await userId();
  const id = String(formData.get("id") ?? "");
  await db.address.deleteMany({ where: { id, userId: uid } });
  revalidatePath("/account");
}

export async function makeDefaultAddress(formData: FormData) {
  const uid = await userId();
  const id = String(formData.get("id") ?? "");
  await db.$transaction([
    db.address.updateMany({ where: { userId: uid }, data: { isDefault: false } }),
    db.address.updateMany({ where: { id, userId: uid }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account");
}
