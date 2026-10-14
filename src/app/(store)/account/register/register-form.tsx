"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { registerAction, type FormState } from "@/server/auth-actions";
import { cn } from "@/lib/utils";

const fields = [
  { name: "name", label: "Your name", type: "text", auto: "name" },
  { name: "email", label: "Email", type: "email", auto: "email" },
  { name: "phone", label: "Phone (optional)", type: "tel", auto: "tel" },
  { name: "password", label: "Choose a password", type: "password", auto: "new-password", hint: "At least 8 characters." },
  { name: "confirm", label: "Type the password again", type: "password", auto: "new-password" },
];

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && (
        <p role="alert" className="rounded-xl bg-destructive/5 p-4 font-medium text-destructive">
          {state.error}
        </p>
      )}
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`r-${f.name}`} className="mb-1.5 block text-lg font-semibold">
            {f.label}
          </label>
          {f.hint && (
            <p id={`r-${f.name}-hint`} className="mb-2 text-muted-foreground">
              {f.hint}
            </p>
          )}
          <input
            id={`r-${f.name}`}
            name={f.name}
            type={f.type}
            autoComplete={f.auto}
            aria-invalid={!!fe[f.name]}
            aria-describedby={[f.hint && `r-${f.name}-hint`, fe[f.name] && `r-${f.name}-err`].filter(Boolean).join(" ") || undefined}
            className={cn("h-13 w-full rounded-xl border-2 bg-background px-4 text-base", fe[f.name] ? "border-destructive" : "border-input")}
          />
          {fe[f.name] && (
            <p id={`r-${f.name}-err`} className="mt-2 font-medium text-destructive">
              {fe[f.name]}
            </p>
          )}
        </div>
      ))}
      <button type="submit" disabled={pending} className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-lg font-semibold text-background disabled:opacity-60">
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Create account
      </button>
    </form>
  );
}
