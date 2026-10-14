"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveDiscount, type DiscountState } from "./actions";
import { adminInput } from "@/components/admin/fields";

export type DiscountValues = { id?: string; code: string; type: "PERCENT" | "FIXED"; value: string; minOrder: string; expiresAt: string; usageLimit: string; isActive: boolean };

export function DiscountForm({ initial, currency }: { initial: DiscountValues; currency: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<DiscountState, FormData>(saveDiscount, {});
  const [type, setType] = useState(initial.type);
  const fe = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) {
      toast.success("Discount code saved.");
      router.push("/admin/discounts");
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <label htmlFor="d-code" className="mb-1.5 block font-semibold">
          Code
        </label>
        <input id="d-code" name="code" defaultValue={initial.code} placeholder="e.g. SUMMER10" className={`${adminInput(fe.code)} uppercase`} aria-invalid={!!fe.code} />
        {fe.code && <p className="mt-1 font-medium text-destructive">{fe.code}</p>}
      </div>
      <fieldset>
        <legend className="mb-1.5 font-semibold">Type</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="PERCENT" checked={type === "PERCENT"} onChange={() => setType("PERCENT")} className="size-5 accent-[var(--brand)]" /> Percentage off
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="FIXED" checked={type === "FIXED"} onChange={() => setType("FIXED")} className="size-5 accent-[var(--brand)]" /> Fixed amount off
          </label>
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="d-value" className="mb-1.5 block font-semibold">
            {type === "PERCENT" ? "Percent off (%)" : `Amount off (${currency})`}
          </label>
          <input id="d-value" name="value" inputMode="decimal" defaultValue={initial.value} className={adminInput(fe.value)} aria-invalid={!!fe.value} />
          {fe.value && <p className="mt-1 font-medium text-destructive">{fe.value}</p>}
        </div>
        <div>
          <label htmlFor="d-min" className="mb-1.5 block font-semibold">
            Minimum order ({currency})
          </label>
          <input id="d-min" name="minOrder" inputMode="decimal" defaultValue={initial.minOrder} className={adminInput()} />
        </div>
        <div>
          <label htmlFor="d-exp" className="mb-1.5 block font-semibold">
            Expires on <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="d-exp" name="expiresAt" type="date" defaultValue={initial.expiresAt} className={adminInput()} />
        </div>
        <div>
          <label htmlFor="d-limit" className="mb-1.5 block font-semibold">
            Usage limit <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="d-limit" name="usageLimit" inputMode="numeric" defaultValue={initial.usageLimit} placeholder="Unlimited" className={adminInput(fe.usageLimit)} />
          {fe.usageLimit && <p className="mt-1 font-medium text-destructive">{fe.usageLimit}</p>}
        </div>
      </div>
      <label className="flex items-center gap-3 font-semibold">
        <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="size-5 accent-[var(--brand)]" /> Active
      </label>
      <button disabled={pending} className="h-12 w-full rounded-xl bg-brand font-semibold text-brand-foreground disabled:opacity-60">
        {pending ? "Saving…" : initial.id ? "Save code" : "Create code"}
      </button>
    </form>
  );
}
