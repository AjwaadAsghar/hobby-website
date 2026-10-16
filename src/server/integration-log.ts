import "server-only";
import { db } from "@/lib/db";

export type Service = "database" | "storage" | "resend" | "telegram" | "webpush";

/** Records each attempt on an external channel. Never throws. */
export async function logIntegration(service: Service, status: "OK" | "SKIPPED" | "FAILED", message: string) {
  if (status === "FAILED") console.error(`[${service}] ${message}`);
  else console.log(`[${service}] ${status}: ${message}`);
  try {
    await db.integrationLog.create({ data: { service, status, message: message.slice(0, 1000) } });
  } catch {
    /* logging must never break the caller */
  }
}

export const integrations = {
  cloudinary: () => !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  supabase: () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  resend: () => !!process.env.RESEND_API_KEY,
  telegram: () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  webpush: () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
};
