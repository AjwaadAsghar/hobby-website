"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { ORDER_FLOW, ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { reviewPayment, saveInternalNotes, updateOrderStatus, markPaidManually, type ActionResult } from "./actions";
import { cn } from "@/lib/utils";

function useResultToast(state: ActionResult, success: string) {
  useEffect(() => {
    if (state.ok) toast.success(success);
    if (state.error) toast.error(state.error);
  }, [state, success]);
}

export function StatusForm({ orderId, status, courierName, trackingNumber }: { orderId: string; status: string; courierName: string; trackingNumber: string }) {
  const [state, action, pending] = useActionState(updateOrderStatus, {});
  const [next, setNext] = useState(() => {
    const i = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
    return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : status;
  });
  useResultToast(state, "Order updated. The customer has been notified.");
  const quick = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="status" className="mb-1.5 block font-semibold">
          Change status to
        </label>
        <select
          id="status"
          name="status"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="h-12 w-full rounded-xl border-2 border-input bg-background px-3 text-base"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
              {s === status ? " (current)" : ""}
            </option>
          ))}
        </select>
        {quick >= 0 && quick < ORDER_FLOW.length - 1 && (
          <p className="mt-1.5 text-sm text-muted-foreground">Next step: {ORDER_STATUS_LABEL[ORDER_FLOW[quick + 1]]}</p>
        )}
      </div>
      {next === "SHIPPED" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="courierName" className="mb-1.5 block font-semibold">
              Courier
            </label>
            <input id="courierName" name="courierName" defaultValue={courierName} list="couriers" required className="h-12 w-full rounded-xl border-2 border-input bg-background px-3" />
            <datalist id="couriers">
              {["TCS", "Leopards", "M&P", "Trax", "PostEx", "BlueEx", "Call Courier", "Pakistan Post"].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="trackingNumber" className="mb-1.5 block font-semibold">
              Tracking number
            </label>
            <input id="trackingNumber" name="trackingNumber" defaultValue={trackingNumber} className="h-12 w-full rounded-xl border-2 border-input bg-background px-3" />
          </div>
        </div>
      )}
      {(next === "CANCELLED" || next === "RETURNED") && (
        <p className="rounded-xl bg-warning/10 p-3 text-sm font-medium">Stock for these items will be added back automatically.</p>
      )}
      <div>
        <label htmlFor="note" className="mb-1.5 block font-semibold">
          Note for the timeline <span className="font-normal text-muted-foreground">(optional, not shown to customer)</span>
        </label>
        <input id="note" name="note" className="h-12 w-full rounded-xl border-2 border-input bg-background px-3" />
      </div>
      <button disabled={pending || next === status} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground font-semibold text-background disabled:opacity-50">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Update status
      </button>
    </form>
  );
}

export function PaymentReview({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(reviewPayment, {});
  useResultToast(state, "Payment decision saved and the customer has been emailed.");
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label htmlFor="pay-note" className="block font-semibold">
        Note <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <input id="pay-note" name="note" placeholder="e.g. Received in Meezan account" className="h-11 w-full rounded-xl border-2 border-input bg-background px-3" />
      <div className="grid grid-cols-2 gap-2">
        <button name="decision" value="approve" disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-success font-semibold text-white disabled:opacity-50">
          <Check className="size-5" aria-hidden /> Approve
        </button>
        <button
          name="decision"
          value="reject"
          disabled={pending}
          onClick={(e) => {
            if (!confirm("Reject this payment? The customer will be asked to upload a new screenshot.")) e.preventDefault();
          }}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-destructive font-semibold text-destructive disabled:opacity-50"
        >
          <X className="size-5" aria-hidden /> Reject
        </button>
      </div>
    </form>
  );
}

export function MarkPaid({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(markPaidManually, {});
  useResultToast(state, "Marked as paid.");
  return (
    <form action={action}>
      <input type="hidden" name="orderId" value={orderId} />
      <button disabled={pending} className="h-11 w-full rounded-xl border-2 border-input font-semibold hover:bg-muted disabled:opacity-50">
        Mark as paid
      </button>
    </form>
  );
}

export function NotesForm({ orderId, notes }: { orderId: string; notes: string }) {
  const [state, action, pending] = useActionState(saveInternalNotes, {});
  useResultToast(state, "Notes saved.");
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label htmlFor="internalNotes" className="sr-only">
        Internal notes
      </label>
      <textarea
        id="internalNotes"
        name="internalNotes"
        defaultValue={notes}
        rows={4}
        placeholder="Only your team can see these notes."
        className="w-full rounded-xl border-2 border-input bg-background px-3 py-2"
      />
      <button disabled={pending} className={cn("h-11 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted disabled:opacity-50")}>
        Save notes
      </button>
    </form>
  );
}
