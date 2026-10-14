import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import { integrations, logIntegration } from "@/server/integration-log";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** Sends a browser push notification to every subscribed admin device. Never throws. */
export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
  if (!integrations.webpush()) {
    await logIntegration("webpush", "SKIPPED", "VAPID keys not set - push not sent. Run `npm run vapid`.");
    return 0;
  }
  const subs = await db.pushSubscription.findMany({ where: { user: { role: { in: ["OWNER", "STAFF"] }, isActive: true } } });
  if (!subs.length) {
    await logIntegration("webpush", "SKIPPED", "No admin devices have turned on notifications yet.");
    return 0;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  let sent = 0;
  const errors: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        } else {
          errors.push((err as Error).message);
        }
      }
    }),
  );
  if (errors.length) await logIntegration("webpush", "FAILED", `Push failed on ${errors.length} device(s): ${errors[0]}`);
  else await logIntegration("webpush", "OK", `Push sent to ${sent} device(s)`);
  return sent;
}
