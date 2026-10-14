import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** True when running against PostgreSQL (affects case-insensitive filters). */
export const isPostgres = /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "");

/**
 * Case-insensitive "contains" filter that works on both SQLite (LIKE is
 * already case-insensitive for ASCII) and PostgreSQL (needs mode).
 */
export function containsText(q: string): { contains: string } {
  return (isPostgres ? { contains: q, mode: "insensitive" } : { contains: q }) as { contains: string };
}
