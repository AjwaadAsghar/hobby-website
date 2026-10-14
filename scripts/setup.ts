/**
 * Runs automatically before `npm run dev`.
 *  1. Creates .env.local with a generated AUTH_SECRET and VAPID keys if missing.
 *  2. Picks the right database provider (SQLite locally).
 *  3. Creates/updates the database tables.
 *  4. Seeds sample data the first time (empty database).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import webpush from "web-push";
import { prepareSchema } from "./prepare-db";
import { loadEnv } from "./load-env";

const root = process.cwd();
const envLocal = path.join(root, ".env.local");

function ensureEnvLocal() {
  const existing = fs.existsSync(envLocal) ? fs.readFileSync(envLocal, "utf8") : "";
  const has = (k: string) => new RegExp(`^${k}=`, "m").test(existing) || !!process.env[k];
  const lines: string[] = [];

  if (!has("DATABASE_URL")) lines.push(`DATABASE_URL="file:./dev.db"`);
  if (!has("AUTH_SECRET")) lines.push(`AUTH_SECRET="${crypto.randomBytes(32).toString("base64")}"`);
  if (!has("NEXT_PUBLIC_SITE_URL")) lines.push(`NEXT_PUBLIC_SITE_URL="http://localhost:3000"`);
  if (!has("NEXT_PUBLIC_VAPID_PUBLIC_KEY") || !has("VAPID_PRIVATE_KEY")) {
    const keys = webpush.generateVAPIDKeys();
    lines.push(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
    lines.push(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
    if (!has("VAPID_SUBJECT")) lines.push(`VAPID_SUBJECT="mailto:admin@example.com"`);
  }

  if (lines.length) {
    const header = existing ? "\n# Added automatically by scripts/setup.ts\n" : "# Generated automatically by scripts/setup.ts. Safe to edit.\n";
    fs.writeFileSync(envLocal, existing + header + lines.join("\n") + "\n");
    console.log(`[setup] wrote ${lines.length} value(s) to .env.local`);
  }
}

function run(cmd: string, args: string[]) {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: process.env });
  return res.status === 0;
}

async function main() {
  ensureEnvLocal();
  loadEnv();
  const { provider, changed } = prepareSchema();
  const generated = path.join(root, "node_modules", ".prisma", "client", "schema.prisma");
  const current = fs.readFileSync(path.join(root, "prisma", "schema.prisma"), "utf8");
  const stale = !fs.existsSync(generated) || fs.readFileSync(generated, "utf8") !== current;
  if (changed || stale) run("npx", ["prisma", "generate"]);

  if (!run("npx", ["prisma", "db", "push", "--skip-generate"])) {
    console.warn(
      "\n[setup] Could not update the database automatically. If you changed the schema and are OK losing local data, run: npm run db:reset\n",
    );
  }

  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  try {
    const users = await db.user.count();
    if (users === 0) {
      console.log("[setup] empty database - adding sample data...");
      run("npx", ["tsx", "prisma/seed.ts"]);
    }
  } finally {
    await db.$disconnect();
  }
  console.log(`[setup] ready (${provider}).`);
}

main().catch((e) => {
  console.error("[setup] failed:", e);
  process.exit(1);
});
