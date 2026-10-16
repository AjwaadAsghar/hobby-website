"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { isValidLoginName } from "@/lib/login-name";
import { revalidatePath } from "next/cache";

export type PwState = { error?: string; fieldErrors?: Record<string, string> };

const schema = z
  .object({
    current: z.string().min(1, "Please enter your current password."),
    password: z
      .string()
      .min(10, "Please use at least 10 characters.")
      .max(200)
      .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Please use both letters and numbers."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "The two new passwords do not match.", path: ["confirm"] })
  .refine((d) => d.password !== d.current, { message: "Please choose a different password from the current one.", path: ["password"] });

export async function changePassword(_prev: PwState, formData: FormData): Promise<PwState> {
  const user = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  if (!(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    return { fieldErrors: { current: "That is not your current password." } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 10), mustChangePassword: false } });
  redirect("/admin?welcome=1");
}

export type LoginNameState = { error?: string; ok?: string };

/** Lets an admin change what they type to sign in: an email or a short username like "admin". */
export async function changeLoginName(_prev: LoginNameState, formData: FormData): Promise<LoginNameState> {
  const user = await requireAdmin();
  const login = String(formData.get("login") ?? "").trim().toLowerCase();
  if (!isValidLoginName(login)) {
    return { error: "Use an email address, or a username of 3–40 letters, numbers, dots, dashes or underscores (no spaces)." };
  }
  if (login === user.email) return { ok: "That is already your sign-in name." };
  const taken = await db.user.findUnique({ where: { email: login }, select: { id: true } });
  if (taken) return { error: "Someone already uses that sign-in name. Please choose another." };
  await db.user.update({ where: { id: user.id }, data: { email: login } });
  revalidatePath("/admin", "layout");
  return { ok: `Saved. Next time, sign in with "${login}".` };
}
