"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export type UserState = { ok?: boolean; error?: string; tempPassword?: string; fieldErrors?: Record<string, string> };

function tempPassword() {
  return crypto.randomBytes(9).toString("base64url").slice(0, 12) + "7a";
}

const addSchema = z.object({
  name: z.string().trim().min(2, "Please enter a name.").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  role: z.enum(["OWNER", "STAFF"]),
});

export async function addAdmin(_prev: UserState, formData: FormData): Promise<UserState> {
  await requireAdmin(["OWNER"]);
  const parsed = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  const pw = tempPassword();
  const passwordHash = await bcrypt.hash(pw, 10);
  if (existing) {
    if (existing.role === "OWNER" || existing.role === "STAFF") return { fieldErrors: { email: "This person is already an admin." } };
    // Upgrade an existing customer account to staff.
    await db.user.update({ where: { id: existing.id }, data: { role: parsed.data.role, name: parsed.data.name, passwordHash, mustChangePassword: true, isActive: true } });
  } else {
    await db.user.create({ data: { ...parsed.data, passwordHash, mustChangePassword: true } });
  }
  revalidatePath("/admin/users");
  return { ok: true, tempPassword: pw };
}

async function ownersLeft(excludeId: string) {
  return db.user.count({ where: { role: "OWNER", isActive: true, id: { not: excludeId } } });
}

export async function updateAdmin(_prev: UserState, formData: FormData): Promise<UserState> {
  const me = await requireAdmin(["OWNER"]);
  const id = String(formData.get("id"));
  const action = String(formData.get("action"));
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return { error: "User not found." };

  if (action === "reset") {
    const pw = tempPassword();
    await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(pw, 10), mustChangePassword: true } });
    revalidatePath("/admin/users");
    return { ok: true, tempPassword: pw };
  }
  if (action === "deactivate") {
    if (id === me.id) return { error: "You cannot deactivate your own account." };
    if (user.role === "OWNER" && (await ownersLeft(id)) === 0) return { error: "There must always be at least one active owner." };
    await db.user.update({ where: { id }, data: { isActive: false } });
  }
  if (action === "activate") await db.user.update({ where: { id }, data: { isActive: true } });
  if (action === "make-owner") await db.user.update({ where: { id }, data: { role: "OWNER" } });
  if (action === "make-staff") {
    if ((await ownersLeft(id)) === 0) return { error: "There must always be at least one active owner." };
    await db.user.update({ where: { id }, data: { role: "STAFF" } });
  }
  revalidatePath("/admin/users");
  return { ok: true };
}
