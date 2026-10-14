"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { saveSettingsGroup } from "@/lib/settings";
import { settingsSchemas } from "@/lib/validation/settings";
import type { StoreSettings } from "@/config/store";

export type SettingsResult = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

/** Saves one settings group. Owner only. Changes show everywhere on the next page load. */
export async function saveSettings(group: keyof typeof settingsSchemas, data: unknown): Promise<SettingsResult> {
  await requireAdmin(["OWNER"]);
  const schema = settingsSchemas[group];
  if (!schema) return { error: "Unknown settings section." };
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { error: Object.values(fieldErrors)[0] ?? "Please check the form.", fieldErrors };
  }
  await saveSettingsGroup(group, parsed.data as StoreSettings[typeof group]);
  revalidatePath("/", "layout");
  return { ok: true };
}
