"use client";

import { useActionState, useEffect, useRef } from "react";
import { addAddress, type AddressState } from "./actions";
import { cn } from "@/lib/utils";

const fields = [
  { name: "label", label: "Address name", placeholder: "Home" },
  { name: "name", label: "Name for delivery", placeholder: "" },
  { name: "phone", label: "Phone", placeholder: "0300 1234567" },
  { name: "address", label: "Full address", placeholder: "House, street, area" },
  { name: "city", label: "City", placeholder: "" },
];

export function AddressForm() {
  const [state, action, pending] = useActionState<AddressState, FormData>(addAddress, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  const fe = state.fieldErrors ?? {};
  return (
    <form ref={ref} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      {fields.map((f) => (
        <div key={f.name} className={f.name === "address" ? "sm:col-span-2" : ""}>
          <label htmlFor={`a-${f.name}`} className="mb-1.5 block font-semibold">
            {f.label}
          </label>
          <input
            id={`a-${f.name}`}
            name={f.name}
            placeholder={f.placeholder}
            aria-invalid={!!fe[f.name]}
            aria-describedby={fe[f.name] ? `a-${f.name}-err` : undefined}
            className={cn("h-12 w-full rounded-xl border-2 bg-background px-4", fe[f.name] ? "border-destructive" : "border-input")}
          />
          {fe[f.name] && (
            <p id={`a-${f.name}-err`} className="mt-1.5 font-medium text-destructive">
              {fe[f.name]}
            </p>
          )}
        </div>
      ))}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-foreground px-6 font-semibold text-background disabled:opacity-60">
          {pending ? "Saving…" : "Save address"}
        </button>
        {state.ok && (
          <span role="status" className="ml-3 font-medium text-success">
            Address saved.
          </span>
        )}
      </div>
    </form>
  );
}
