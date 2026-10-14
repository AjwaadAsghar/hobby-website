"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean };

function safeNext(next: unknown, fallback: string) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const area = formData.get("area") === "admin" ? "admin" : "account";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fieldErrors: Record<string, string> = {};
  if (!z.string().email().safeParse(email).success) fieldErrors.email = "Please enter your email address, for example name@example.com.";
  if (!password) fieldErrors.password = "Please enter your password.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const user = await db.user.findUnique({ where: { email }, select: { role: true } });
  if (area === "admin" && user && user.role === "CUSTOMER") {
    return { error: "This account cannot open the admin area." };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      const code = (err as AuthError & { code?: string }).code;
      if (code === "rate_limited") return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
      return { error: "That email and password do not match. Please check and try again." };
    }
    throw err;
  }
  redirect(safeNext(formData.get("next"), area === "admin" ? "/admin" : "/account"));
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name.").max(80),
    email: z.string().trim().toLowerCase().email("Please enter a valid email address, for example name@example.com."),
    phone: z
      .string()
      .trim()
      .refine((v) => !v || v.replace(/\D/g, "").length >= 10, "Please check your phone number, e.g. 0300 1234567.")
      .optional()
      .default(""),
    password: z.string().min(8, "Please choose a password with at least 8 characters.").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "The two passwords do not match.", path: ["confirm"] });

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!rateLimit(`register:${clientIp(await headers())}`, 5, 60 * 60_000).ok) {
    return { error: "Too many sign-ups from this connection. Please try again later." };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const d = parsed.data;
  const exists = await db.user.findUnique({ where: { email: d.email } });
  if (exists) return { fieldErrors: { email: "An account with this email already exists. Try signing in instead." } };
  await db.user.create({ data: { name: d.name, email: d.email, phone: d.phone || null, role: "CUSTOMER", passwordHash: await bcrypt.hash(d.password, 10) } });
  await signIn("credentials", { email: d.email, password: d.password, redirect: false });
  redirect(safeNext(formData.get("next"), "/account"));
}

export async function logoutAction(formData: FormData) {
  const area = formData.get("area") === "admin" ? "/admin/login" : "/";
  await signOut({ redirect: false });
  redirect(area);
}
