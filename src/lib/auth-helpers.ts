import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type AdminRole = "OWNER" | "STAFF";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Loads the signed-in admin from the DB (so deactivated users lose access
 * immediately). Cached per request: the layout and the page share one lookup.
 */
export const getAdmin = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.isActive || (user.role !== "OWNER" && user.role !== "STAFF")) return null;
  return user;
});

/** For admin pages: redirects when not allowed. */
export async function requireAdminPage(roles: AdminRole[] = ["OWNER", "STAFF"]) {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  if (!roles.includes(user.role as AdminRole)) redirect("/admin?denied=1");
  return user;
}

/** For server actions / API routes: throws when not allowed. */
export async function requireAdmin(roles: AdminRole[] = ["OWNER", "STAFF"]) {
  const user = await getAdmin();
  if (!user) throw new AuthError("Please sign in again.", 401);
  if (!roles.includes(user.role as AdminRole)) throw new AuthError("You do not have permission to do that.", 403);
  return user;
}

export async function getCustomer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
}
