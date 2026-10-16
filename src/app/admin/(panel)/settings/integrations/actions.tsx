"use server";

import { revalidatePath } from "next/cache";
import { db, isPostgres } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettings, siteUrl } from "@/lib/settings";
import { integrations, logIntegration } from "@/server/integration-log";
import { sendEmail, getEmailBrand } from "@/server/email/send";
import { sendTelegram, tgEscape } from "@/server/telegram";
import { sendPushToAdmins } from "@/server/push";
import { storeUpload } from "@/server/storage";
import { SimpleEmail } from "@/emails/order-emails";

export type TestResult = { ok: boolean; message: string };

// 1x1 transparent PNG used to test Cloudinary uploads.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

export async function testIntegration(service: string): Promise<TestResult> {
  const admin = await requireAdmin(["OWNER"]);
  const s = await getSettings();
  let result: TestResult;
  switch (service) {
    case "database": {
      try {
        const n = await db.product.count();
        result = { ok: true, message: `Connected to ${isPostgres ? "PostgreSQL" : "SQLite"} - ${n} products found.` };
        await logIntegration("database", "OK", result.message);
      } catch (err) {
        result = { ok: false, message: `Database error: ${(err as Error).message}` };
        await logIntegration("database", "FAILED", result.message);
      }
      break;
    }
    case "storage": {
      if (!integrations.cloudinary() && !integrations.supabase()) {
        result = { ok: false, message: "No cloud storage keys are set, so uploads are saved on this server instead." };
        break;
      }
      const url = await storeUpload(new File([PNG], "test.png", { type: "image/png" }), { folder: "branding", kind: "image" });
      const where = url.url.includes("cloudinary") ? "Cloudinary" : url.url.includes(".supabase.co/storage") ? "Supabase Storage" : "";
      result = where ? { ok: true, message: `Test image uploaded to ${where}.` } : { ok: false, message: "Upload to cloud storage failed - check the keys. See the log below." };
      break;
    }
    case "resend": {
      const to = s.notifications.ownerEmail || admin.email;
      await sendEmail({
        to,
        subject: `Test email from ${s.branding.storeName}`,
        react: <SimpleEmail brand={await getEmailBrand()} title="Your email is working" body={`This is a test email sent from the admin by ${admin.name}.\nIf you received it, order emails will reach you too.`} />,
      });
      result = integrations.resend()
        ? { ok: true, message: `Test email sent to ${to}. Check your inbox (and spam folder).` }
        : { ok: false, message: `RESEND_API_KEY is not set. The test email was saved to the Email log instead of being sent.` };
      break;
    }
    case "telegram": {
      const ok = await sendTelegram(`✅ <b>Test from ${tgEscape(s.branding.storeName)}</b>\nTelegram alerts are working. Sent by ${tgEscape(admin.name)}.\n<a href="${siteUrl()}/admin">Open admin</a>`);
      result = ok ? { ok: true, message: "Test message sent. Check your Telegram." } : { ok: false, message: integrations.telegram() ? "Telegram rejected the message - check the token and chat ID (see the log below)." : "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are not set." };
      break;
    }
    case "webpush": {
      const sent = await sendPushToAdmins({ title: "Test notification", body: `Push alerts are working for ${s.branding.storeName}.`, url: "/admin/settings/integrations" });
      result = sent > 0 ? { ok: true, message: `Sent to ${sent} device(s).` } : { ok: false, message: integrations.webpush() ? "No devices have notifications turned on yet. Use the button above on each phone or computer." : "VAPID keys are not set." };
      break;
    }
    default:
      result = { ok: false, message: "Unknown service." };
  }
  revalidatePath("/admin/settings/integrations");
  return result;
}
