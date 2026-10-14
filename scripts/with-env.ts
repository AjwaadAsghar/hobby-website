/** Runs a command with .env/.env.local loaded, e.g. `tsx scripts/with-env.ts prisma studio`. */
import { spawnSync } from "node:child_process";
import { loadEnv } from "./load-env";
import { prepareSchema } from "./prepare-db";

loadEnv();
prepareSchema();
const [cmd, ...args] = process.argv.slice(2);
const res = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: process.env });
process.exit(res.status ?? 1);
