import Link from "next/link";
import { db } from "@/lib/db";
import { getMoneyFormat } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/admin-shell";
import { Panel } from "@/components/admin/badges";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { DiscountForm, type DiscountValues } from "./discount-form";
import { deleteDiscount, toggleDiscount } from "./actions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Discount codes" };

export default async function DiscountsPage({ searchParams }: PageProps<"/admin/discounts">) {
  const sp = await searchParams;
  const [codes, fmt] = await Promise.all([db.discountCode.findMany({ orderBy: { createdAt: "desc" } }), getMoneyFormat()]);
  const editing = typeof sp.edit === "string" ? codes.find((c) => c.id === sp.edit) : undefined;
  const now = new Date();
  const initial: DiscountValues = editing
    ? {
        id: editing.id,
        code: editing.code,
        type: editing.type as DiscountValues["type"],
        value: editing.type === "PERCENT" ? String(editing.value) : String(editing.value / 100),
        minOrder: String(editing.minOrder / 100),
        expiresAt: editing.expiresAt ? editing.expiresAt.toISOString().slice(0, 10) : "",
        usageLimit: editing.usageLimit ? String(editing.usageLimit) : "",
        isActive: editing.isActive,
      }
    : { code: "", type: "PERCENT", value: "10", minOrder: "0", expiresAt: "", usageLimit: "", isActive: true };

  return (
    <>
      <PageHeader title="Discount codes" description="Customers type these at checkout. Totals are always checked on the server." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b bg-muted/50 text-sm">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-3 py-3 font-semibold">Discount</th>
                <th className="px-3 py-3 font-semibold">Used</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No discount codes yet.
                  </td>
                </tr>
              )}
              {codes.map((c) => {
                const expired = c.expiresAt && c.expiresAt < now;
                const usedUp = c.usageLimit !== null && c.usedCount >= c.usageLimit;
                const status = !c.isActive ? "Off" : expired ? "Expired" : usedUp ? "Used up" : "Active";
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold">{c.code}</p>
                      <p className="text-sm text-muted-foreground">{c.expiresAt ? `Until ${formatDate(c.expiresAt)}` : "No expiry"}</p>
                    </td>
                    <td className="px-3 py-3">
                      {c.type === "PERCENT" ? `${c.value}% off` : `${formatMoney(c.value, fmt)} off`}
                      {c.minOrder > 0 && <p className="text-sm text-muted-foreground">Min. {formatMoney(c.minOrder, fmt)}</p>}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {c.usedCount}
                      {c.usageLimit !== null && ` / ${c.usageLimit}`}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-semibold", status === "Active" ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200")}>{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/discounts?edit=${c.id}`} className="inline-flex h-10 items-center rounded-lg border-2 border-input px-3 text-sm font-semibold hover:bg-muted">
                          Edit
                        </Link>
                        <form action={toggleDiscount}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="h-10 rounded-lg border-2 border-input px-3 text-sm font-semibold hover:bg-muted">{c.isActive ? "Turn off" : "Turn on"}</button>
                        </form>
                        <form action={deleteDiscount}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmSubmit message={`Delete code ${c.code}?`} className="h-10 rounded-lg px-3 text-sm font-semibold text-destructive hover:bg-destructive/5">
                            Delete
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Panel title={editing ? `Edit ${editing.code}` : "New discount code"} action={editing && <Link href="/admin/discounts" className="text-sm font-semibold underline">Cancel</Link>}>
          <DiscountForm key={editing?.id ?? "new"} initial={initial} currency={fmt.currency} />
        </Panel>
      </div>
    </>
  );
}
