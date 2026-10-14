import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { deepMerge, parseJson } from "@/lib/json";
import { settingGroups, storeDefaults, type StoreSettings } from "@/config/store";

/**
 * Loads all settings once per request and merges them over the defaults in
 * src/config/store.ts. Pages are rendered dynamically, so changes in the admin
 * show up on the next page load everywhere (header, emails, invoices, ...).
 */
export const getSettings = cache(async (): Promise<StoreSettings> => {
  try {
    const rows = await db.setting.findMany();
    const stored: Record<string, unknown> = {};
    for (const row of rows) stored[row.key] = parseJson(row.value, undefined);
    return deepMerge(storeDefaults, stored);
  } catch (err) {
    console.error("[settings] falling back to defaults:", err);
    return storeDefaults;
  }
});

export async function saveSettingsGroup<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
  if (!settingGroups.includes(key)) throw new Error(`Unknown settings group ${key}`);
  await db.setting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });
}

/** Money format derived from settings. */
export async function getMoneyFormat() {
  const s = await getSettings();
  return { currency: s.commerce.currency, locale: s.commerce.locale };
}

export function siteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}
