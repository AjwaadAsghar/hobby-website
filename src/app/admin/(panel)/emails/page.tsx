import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { integrations } from "@/server/integration-log";
import { PageHeader } from "@/components/admin/admin-shell";
import { cn } from "@/lib/utils";

export const metadata = { title: "Email log" };

const tone: Record<string, string> = {
  SENT: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  LOGGED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  FAILED: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};
const label: Record<string, string> = { SENT: "Sent", LOGGED: "Saved only (no email service)", FAILED: "Failed" };

export default async function EmailLogPage({ searchParams }: PageProps<"/admin/emails">) {
  const sp = await searchParams;
  const selected = typeof sp.id === "string" ? sp.id : undefined;
  const emails = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, to: true, subject: true, status: true, error: true, createdAt: true } });
  const current = selected ? await db.emailLog.findUnique({ where: { id: selected } }) : null;

  return (
    <>
      <PageHeader title="Email log" description="Every email the store has sent or tried to send." />
      {!integrations.resend() && (
        <p className="mb-4 rounded-2xl bg-warning/10 p-4 font-medium">
          Email sending is not set up yet, so emails are saved here instead of being delivered. Add a Resend API key to send them for real (see Settings → Integrations).
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {emails.length === 0 && <li className="p-6 text-center text-muted-foreground">No emails yet.</li>}
          {emails.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/emails?id=${e.id}`} className={cn("block px-4 py-3 hover:bg-muted/50", e.id === selected && "bg-muted")} aria-current={e.id === selected ? "true" : undefined}>
                <p className="font-semibold">{e.subject}</p>
                <p className="text-sm text-muted-foreground">
                  To {e.to} · {formatDate(e.createdAt, true)}
                </p>
                <span className={cn("mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", tone[e.status])}>{label[e.status] ?? e.status}</span>
                {e.error && <p className="mt-1 text-sm text-destructive">{e.error}</p>}
              </Link>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl border bg-card p-3 shadow-sm">
          {current ? (
            <>
              <p className="px-2 pb-2 font-semibold">{current.subject}</p>
              <iframe title={`Email: ${current.subject}`} srcDoc={current.html} sandbox="" className="h-[70vh] w-full rounded-xl border bg-white" />
            </>
          ) : (
            <p className="p-6 text-center text-muted-foreground">Choose an email to preview it.</p>
          )}
        </div>
      </div>
    </>
  );
}
