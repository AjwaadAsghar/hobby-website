"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { changePassword, type PwState } from "./actions";
import { cn } from "@/lib/utils";

const fields = [
  { name: "current", label: "Current password", auto: "current-password" },
  { name: "password", label: "New password", auto: "new-password", hint: "At least 10 characters, with letters and numbers." },
  { name: "confirm", label: "Type the new password again", auto: "new-password" },
];

export function PasswordForm() {
  const [state, action, pending] = useActionState<PwState, FormData>(changePassword, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <p role="alert" className="rounded-xl bg-destructive/5 p-4 font-medium text-destructive">{state.error}</p>}
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`pw-${f.name}`} className="mb-1.5 block font-semibold">
            {f.label}
          </label>
          {f.hint && <p id={`pw-${f.name}-hint`} className="mb-2 text-muted-foreground">{f.hint}</p>}
          <input
            id={`pw-${f.name}`}
            name={f.name}
            type="password"
            autoComplete={f.auto}
            aria-invalid={!!fe[f.name]}
            aria-describedby={[f.hint && `pw-${f.name}-hint`, fe[f.name] && `pw-${f.name}-err`].filter(Boolean).join(" ") || undefined}
            className={cn("h-12 w-full rounded-xl border-2 bg-background px-4", fe[f.name] ? "border-destructive" : "border-input")}
          />
          {fe[f.name] && <p id={`pw-${f.name}-err`} className="mt-1.5 font-medium text-destructive">{fe[f.name]}</p>}
        </div>
      ))}
      <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground font-semibold text-background disabled:opacity-60">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Save new password
      </button>
    </form>
  );
}
