import Link from "next/link";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { db, isPostgres } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { integrations } from "@/server/integration-log";
import { requireAdminPage } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/admin/admin-shell";
import { PushToggle } from "@/components/admin/push-toggle";
import { TestButton } from "./test-button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Integrations" };

type ServiceCard = {
  id: "database" | "cloudinary" | "resend" | "telegram" | "webpush";
  name: string;
  what: string;
  configured: boolean;
  warning?: string;
  fallback: string;
  envs: string[];
  test: string;
};

export default async function IntegrationsPage() {
  await requireAdminPage(["OWNER"]);
  let dbOk = true;
  try {
    await db.$queryRawUnsafe("SELECT 1");
  } catch {
    dbOk = false;
  }
  const onVercel = !!process.env.VERCEL;
  const services: ServiceCard[] = [
    {
      id: "database",
      name: "Database",
      what: `Stores products, orders and settings. Currently using ${isPostgres ? "PostgreSQL" : "SQLite (a local file)"}.`,
      configured: dbOk,
      warning: !isPostgres && onVercel ? "SQLite does not work on Vercel. Add a Neon or Supabase PostgreSQL DATABASE_URL." : undefined,
      fallback: "Required - the store cannot run without it.",
      envs: ["DATABASE_URL"],
      test: "Test connection",
    },
    {
      id: "cloudinary",
      name: "Cloudinary (image uploads)",
      what: "Stores product photos, payment screenshots and 3D models in the cloud.",
      configured: integrations.cloudinary(),
      warning: !integrations.cloudinary() && onVercel ? "On Vercel, files saved without Cloudinary disappear after a while. Add Cloudinary keys." : undefined,
      fallback: "Not set: uploads are saved to the uploads/ folder on this server.",
      envs: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
      test: "Upload a test image",
    },
    {
      id: "resend",
      name: "Resend (email)",
      what: "Sends order confirmations, shipping updates and new-order emails to you.",
      configured: integrations.resend(),
      fallback: "Not set: emails are saved to the Email log instead of being sent.",
      envs: ["RESEND_API_KEY", "EMAIL_FROM"],
      test: "Send test email",
    },
    {
      id: "telegram",
      name: "Telegram alerts",
      what: "Instant message on your phone for every new order, payment screenshot and low stock.",
      configured: integrations.telegram(),
      fallback: "Not set: Telegram alerts are skipped (orders still save normally).",
      envs: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
      test: "Send test message",
    },
    {
      id: "webpush",
      name: "Browser push notifications",
      what: "Pop-up alerts on your phone or computer, even when the admin is closed.",
      configured: integrations.webpush(),
      fallback: "Not set: push is skipped. Run `npm run vapid` to create keys.",
      envs: ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"],
      test: "Send test notification",
    },
  ];

  const logs = await db.integrationLog.findMany({ orderBy: { createdAt: "desc" }, take: 150 });
  const [devices] = await Promise.all([db.pushSubscription.count()]);

  return (
    <>
      <PageHeader
        title="Integrations"
        description="See which outside services are connected. Every service is optional except the database - if one is missing or fails, orders still save and the problem shows here."
      />
      <div className="space-y-4">
        {services.map((svc) => {
          const recent = logs.filter((l) => l.service === svc.id).slice(0, 4);
          const lastFail = recent.find((l) => l.status === "FAILED");
          const status = !svc.configured ? "off" : svc.warning || (lastFail && recent[0]?.status === "FAILED") ? "warn" : "ok";
          return (
            <section key={svc.id} className="rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby={`svc-${svc.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 id={`svc-${svc.id}`} className="flex flex-wrap items-center gap-3 text-lg font-bold">
                    {svc.name}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                        status === "ok" && "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
                        status === "warn" && "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
                        status === "off" && "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
                      )}
                    >
                      {status === "ok" ? <CheckCircle2 className="size-4" aria-hidden /> : status === "warn" ? <CircleAlert className="size-4" aria-hidden /> : <XCircle className="size-4" aria-hidden />}
                      {status === "ok" ? "Connected" : status === "warn" ? "Needs attention" : "Not configured"}
                    </span>
                  </h2>
                  <p className="mt-1 text-muted-foreground">{svc.what}</p>
                  {!svc.configured && <p className="mt-1 text-sm">{svc.fallback}</p>}
                  {svc.warning && <p className="mt-2 rounded-xl bg-warning/10 p-3 text-sm font-medium">{svc.warning}</p>}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Settings: {svc.envs.map((e) => <code key={e} className="mr-1.5 rounded bg-muted px-1.5 py-0.5 text-xs">{e}</code>)}
                  </p>
                  {svc.id === "webpush" && (
                    <div className="mt-4 rounded-xl border p-4">
                      <p className="mb-3 text-sm">
                        <strong>{devices}</strong> device{devices === 1 ? "" : "s"} receiving notifications. Tip: install the admin as an app (browser menu → “Install” or “Add to Home Screen”), then turn on notifications.
                      </p>
                      <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
                    </div>
                  )}
                </div>
                <TestButton service={svc.id} label={svc.test} />
              </div>
              {recent.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">Recent activity</summary>
                  <ul className="mt-2 space-y-1 text-sm">
                    {recent.map((l) => (
                      <li key={l.id} className="flex gap-2">
                        <span className={cn("shrink-0 font-semibold", l.status === "OK" ? "text-success" : l.status === "FAILED" ? "text-destructive" : "text-muted-foreground")}>{l.status}</span>
                        <span className="shrink-0 text-muted-foreground">{formatDate(l.createdAt, true)}</span>
                        <span className="min-w-0 break-words">{l.message}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          );
        })}
      </div>
      <p className="mt-6 text-muted-foreground">
        Step-by-step setup instructions for each service are in <strong>SETUP_CHECKLIST.md</strong>. Emails that were not sent can be read in the{" "}
        <Link href="/admin/emails" className="font-semibold text-foreground underline underline-offset-4">
          Email log
        </Link>
        .
      </p>
    </>
  );
}
