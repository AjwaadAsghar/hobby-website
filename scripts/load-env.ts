import * as nextEnv from "@next/env";

type EnvModule = { loadEnvConfig: (dir: string, dev?: boolean) => unknown };

/** Loads .env, .env.local etc. exactly like Next.js does. */
export function loadEnv() {
  const mod = ((nextEnv as unknown as { default?: EnvModule }).default ?? nextEnv) as EnvModule;
  mod.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
}
