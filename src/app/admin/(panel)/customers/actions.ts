"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function markMessageRead(formData: FormData) {
  await requireAdmin();
  await db.contactMessage.update({ where: { id: String(formData.get("id")) }, data: { isRead: true } }).catch(() => null);
  revalidatePath("/admin/customers");
}
