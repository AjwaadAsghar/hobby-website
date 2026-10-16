import { z } from "zod";

/**
 * Admins sign in with either an email or a short username (e.g. "admin").
 * Usernames never contain "@", so they can't clash with customer emails.
 * Both are stored in the User.email column.
 */
export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,39}$/;

export function isValidLoginName(value: string): boolean {
  return z.string().email().safeParse(value).success || USERNAME_RE.test(value);
}
