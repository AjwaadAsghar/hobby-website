"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, Search } from "lucide-react";
import { trackOrder, type TrackState } from "./actions";
import { OrderProgress, OrderSummaryCard } from "@/components/store/order/order-details";
import { ProofUpload } from "@/components/store/order/proof-upload";
import { cn } from "@/lib/utils";

export function TrackForm({ defaultNumber }: { defaultNumber: string }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, { status: "idle" });
  const errors = state.status === "error" ? state.errors : {};
  const values = state.status === "error" ? state.values : { number: defaultNumber, phone: "" };

  return (
    <div className="space-y-10">
      <form action={action} className="space-y-5 rounded-3xl border p-6 sm:p-8" noValidate>
        {errors.form && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/5 p-4 text-lg font-medium text-destructive">
            <AlertTriangle className="mt-1 size-5 shrink-0" aria-hidden /> {errors.form}
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="track-number" className="mb-1.5 block text-lg font-semibold">
              Order number
            </label>
            <p id="track-number-hint" className="mb-2 text-muted-foreground">
              From your confirmation, e.g. 10023
            </p>
            <input
              id="track-number"
              name="number"
              inputMode="numeric"
              defaultValue={values.number}
              key={`n-${values.number}`}
              aria-invalid={!!errors.number}
              aria-describedby={`track-number-hint${errors.number ? " track-number-error" : ""}`}
              className={cn("h-13 w-full rounded-xl border-2 bg-background px-4 text-lg", errors.number ? "border-destructive" : "border-input")}
            />
            {errors.number && (
              <p id="track-number-error" className="mt-2 font-medium text-destructive">
                {errors.number}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="track-phone" className="mb-1.5 block text-lg font-semibold">
              Phone number
            </label>
            <p id="track-phone-hint" className="mb-2 text-muted-foreground">
              The one you used when ordering
            </p>
            <input
              id="track-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={values.phone}
              key={`p-${values.phone}`}
              aria-invalid={!!errors.phone}
              aria-describedby={`track-phone-hint${errors.phone ? " track-phone-error" : ""}`}
              className={cn("h-13 w-full rounded-xl border-2 bg-background px-4 text-lg", errors.phone ? "border-destructive" : "border-input")}
            />
            {errors.phone && (
              <p id="track-phone-error" className="mt-2 font-medium text-destructive">
                {errors.phone}
              </p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-lg font-semibold text-brand-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Search className="size-5" aria-hidden />}
          Find my order
        </button>
      </form>

      {state.status === "found" && (
        <section aria-live="polite" className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border p-6">
            <OrderProgress order={state.order} />
            {state.order.paymentMethod !== "cod" && ["AWAITING_PAYMENT", "REJECTED"].includes(state.order.paymentStatus) && (
              <div className="mt-8 border-t pt-6">
                <h2 className="mb-3 text-xl font-bold">
                  {state.order.paymentStatus === "REJECTED" ? "Please upload a new payment screenshot" : "Upload your payment screenshot"}
                </h2>
                <ProofUpload number={state.order.number} phone={state.phone} />
              </div>
            )}
          </div>
          <OrderSummaryCard order={state.order} fmt={state.fmt} />
        </section>
      )}
    </div>
  );
}
