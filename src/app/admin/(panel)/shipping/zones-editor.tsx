"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveZones } from "./actions";

type Zone = { id?: string; name: string; cities: string; rate: string; isDefault: boolean };

export function ZonesEditor({ initial, currency }: { initial: Zone[]; currency: string }) {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>(initial);
  const [pending, start] = useTransition();
  const update = (i: number, patch: Partial<Zone>) => setZones((z) => z.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  function save() {
    start(async () => {
      const res = await saveZones(
        zones.map((z) => ({ ...z, cities: z.cities.split(",").map((c) => c.trim()).filter(Boolean), rate: z.rate || 0 })),
      );
      if (res.ok) {
        toast.success("Shipping zones saved.");
        router.refresh();
      } else toast.error(res.error ?? "Could not save.");
    });
  }

  return (
    <div className="space-y-4">
      {zones.map((z, i) => (
        <div key={z.id ?? `new-${i}`} className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_2fr_160px]">
            <label>
              <span className="mb-1.5 block font-semibold">Zone name</span>
              <input value={z.name} onChange={(e) => update(i, { name: e.target.value })} className="h-12 w-full rounded-xl border-2 border-input bg-background px-3" />
            </label>
            {z.isDefault ? (
              <div>
                <span className="mb-1.5 block font-semibold">Cities</span>
                <p className="flex h-12 items-center rounded-xl bg-muted px-3">All cities not listed in another zone</p>
              </div>
            ) : (
              <label>
                <span className="mb-1.5 block font-semibold">Cities (separate with commas)</span>
                <input value={z.cities} onChange={(e) => update(i, { cities: e.target.value })} placeholder="Lahore, Kasur, Sheikhupura" className="h-12 w-full rounded-xl border-2 border-input bg-background px-3" />
              </label>
            )}
            <label>
              <span className="mb-1.5 block font-semibold">Rate ({currency})</span>
              <input value={z.rate} inputMode="decimal" onChange={(e) => update(i, { rate: e.target.value })} className="h-12 w-full rounded-xl border-2 border-input bg-background px-3" />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 font-medium">
              <input type="radio" name="default-zone" checked={z.isDefault} onChange={() => setZones((all) => all.map((x, k) => ({ ...x, isDefault: k === i })))} className="size-5 accent-[var(--brand)]" />
              Use for all other cities
            </label>
            <button type="button" disabled={z.isDefault} onClick={() => setZones((all) => all.filter((_, k) => k !== i))} className="inline-flex h-10 items-center gap-1 rounded-lg px-3 font-medium text-destructive hover:bg-destructive/5 disabled:opacity-30">
              <Trash2 className="size-4" aria-hidden /> Remove zone
            </button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" onClick={() => setZones((z) => [...z.map((x) => x), { name: "", cities: "", rate: "0", isDefault: false }])} className="inline-flex h-12 items-center gap-1 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
          <Plus className="size-4" aria-hidden /> Add zone
        </button>
        <button type="button" onClick={save} disabled={pending} className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 font-semibold text-brand-foreground disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save zones
        </button>
      </div>
    </div>
  );
}
