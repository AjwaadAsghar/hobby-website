"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveInventory } from "./actions";
import { cn } from "@/lib/utils";

export type InvRow = {
  key: string;
  kind: "product" | "variant";
  id: string;
  productId: string;
  title: string;
  variant: string | null;
  sku: string | null;
  stock: number;
  threshold: number;
  showThreshold: boolean;
};

export function InventoryTable({ rows }: { rows: InvRow[] }) {
  const router = useRouter();
  const [edits, setEdits] = useState<Record<string, { stock?: number; threshold?: number }>>({});
  const [saving, start] = useTransition();
  const changed = Object.keys(edits).length;

  const val = (r: InvRow) => edits[r.key]?.stock ?? r.stock;
  const thr = (r: InvRow) => edits[r.key]?.threshold ?? r.threshold;
  const setStock = (r: InvRow, n: number) => {
    const stock = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
    setEdits((e) => {
      const next = { ...e, [r.key]: { ...e[r.key], stock } };
      if (stock === r.stock && (next[r.key].threshold ?? r.threshold) === r.threshold) delete next[r.key];
      return next;
    });
  };

  function save() {
    start(async () => {
      const changes = rows
        .filter((r) => edits[r.key])
        .map((r) => ({ kind: r.kind, id: r.id, productId: r.productId, stock: val(r), threshold: r.showThreshold ? thr(r) : undefined }));
      const res = await saveInventory(changes);
      if (res.ok) {
        toast.success(`Saved ${res.saved} change${res.saved === 1 ? "" : "s"}.`);
        setEdits({});
        router.refresh();
      } else toast.error(res.error ?? "Could not save.");
    });
  }

  return (
    <>
      <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-sm">
        <p className="font-medium" role="status">
          {changed ? `${changed} unsaved change${changed === 1 ? "" : "s"}` : "Change a number, then press Save."}
        </p>
        <div className="flex gap-2">
          {changed > 0 && (
            <button onClick={() => setEdits({})} className="h-11 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted">
              Undo changes
            </button>
          )}
          <button onClick={save} disabled={!changed || saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-brand-foreground disabled:opacity-50">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Save stock
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b bg-muted/50 text-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-3 py-3 font-semibold">SKU</th>
              <th className="px-3 py-3 font-semibold">In stock</th>
              <th className="px-3 py-3 font-semibold">Alert at</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Nothing to show.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const stock = val(r);
              const low = stock <= thr(r);
              return (
                <tr key={r.key} className={cn("border-b last:border-0", edits[r.key] && "bg-brand-soft/60")}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/products/${r.productId}`} className="font-semibold hover:underline">
                      {r.title}
                    </Link>
                    {r.variant && <p className="text-sm text-muted-foreground">{r.variant}</p>}
                  </td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{r.sku ?? "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setStock(r, stock - 1)} disabled={stock <= 0} className="flex size-10 items-center justify-center rounded-lg border hover:bg-muted disabled:opacity-30" aria-label={`Decrease stock for ${r.title} ${r.variant ?? ""}`}>
                        <Minus className="size-4" aria-hidden />
                      </button>
                      <input
                        inputMode="numeric"
                        aria-label={`Stock for ${r.title} ${r.variant ?? ""}`}
                        value={stock}
                        onChange={(e) => setStock(r, Number(e.target.value.replace(/\D/g, "")))}
                        className={cn("h-10 w-20 rounded-lg border-2 bg-background text-center font-semibold tabular-nums", stock === 0 ? "border-destructive text-destructive" : low ? "border-warning text-warning" : "border-input")}
                      />
                      <button onClick={() => setStock(r, stock + 1)} className="flex size-10 items-center justify-center rounded-lg border hover:bg-muted" aria-label={`Increase stock for ${r.title} ${r.variant ?? ""}`}>
                        <Plus className="size-4" aria-hidden />
                      </button>
                      {stock === 0 ? <span className="ml-2 text-sm font-semibold text-destructive">Sold out</span> : low && <span className="ml-2 text-sm font-semibold text-warning">Low</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {r.showThreshold ? (
                      <input
                        inputMode="numeric"
                        aria-label={`Low stock alert level for ${r.title}`}
                        value={thr(r)}
                        onChange={(e) => {
                          const t = Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0);
                          setEdits((x) => ({ ...x, [r.key]: { ...x[r.key], threshold: t, stock: x[r.key]?.stock ?? r.stock } }));
                        }}
                        className="h-10 w-20 rounded-lg border-2 border-input bg-background text-center tabular-nums"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{r.threshold} (product)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
