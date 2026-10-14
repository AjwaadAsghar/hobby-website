import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap", ORDER_STATUS_TONE[status], className)}>{ORDER_STATUS_LABEL[status] ?? status}</span>;
}

export function PaymentBadge({ status, className }: { status: string; className?: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap", PAYMENT_STATUS_TONE[status], className)}>{PAYMENT_STATUS_LABEL[status] ?? status}</span>;
}

export function StatCard({ label, value, sub, tone, href }: { label: string; value: string; sub?: string; tone?: "warning" | "default"; href?: string }) {
  const body = (
    <>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tracking-tight break-words tabular-nums 2xl:text-3xl", tone === "warning" && "text-warning")}>{value}</p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </>
  );
  const cls = "block rounded-2xl border bg-card p-5 shadow-sm";
  return href ? (
    <a href={href} className={cn(cls, "transition hover:border-foreground/40 hover:shadow-md")}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-sm", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
