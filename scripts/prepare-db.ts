/**
 * Points prisma/schema.prisma at the right database provider based on
 * DATABASE_URL: "file:..." => sqlite, "postgres://..." => postgresql.
 * Runs automatically before dev, build and seed.
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./load-env";

export function prepareSchema(): { provider: string; changed: boolean } {
  loadEnv();
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const provider = /^postgres(ql)?:\/\//.test(url) ? "postgresql" : "sqlite";
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const schema = fs.readFileSync(schemaPath, "utf8");
  const next = schema.replace(
    /(datasource db \{\s*provider\s*=\s*")(sqlite|postgresql)(")/,
    `$1${provider}$3`,
  );
  const changed = next !== schema;
  if (changed) fs.writeFileSync(schemaPath, next);
  return { provider, changed };
}

if (process.argv[1] && process.argv[1].includes("prepare-db")) {
  const { provider, changed } = prepareSchema();
  console.log(`[db] provider: ${provider}${changed ? " (schema updated)" : ""}`);
}
