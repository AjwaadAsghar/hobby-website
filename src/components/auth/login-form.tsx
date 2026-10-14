"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction, type FormState } from "@/server/auth-actions";
import { cn } from "@/lib/utils";

export function LoginForm({ area, next }: { area: "admin" | "account"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="area" value={area} />
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && (
        <p role="alert" className="rounded-xl bg-destructive/5 p-4 font-medium text-destructive">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor={`${area}-email`} className="mb-1.5 block text-lg font-semibold">
          Email
        </label>
        <input
          id={`${area}-email`}
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
          key={state.values?.email ?? "email"}
          required
          aria-invalid={!!fe.email}
          aria-describedby={fe.email ? `${area}-email-err` : undefined}
          className={cn("h-13 w-full rounded-xl border-2 bg-background px-4 text-base", fe.email ? "border-destructive" : "border-input")}
        />
        {fe.email && (
          <p id={`${area}-email-err`} className="mt-2 font-medium text-destructive">
            {fe.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${area}-password`} className="mb-1.5 block text-lg font-semibold">
          Password
        </label>
        <div className="relative">
          <input
            id={`${area}-password`}
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={!!fe.password}
            aria-describedby={fe.password ? `${area}-password-err` : undefined}
            className={cn("h-13 w-full rounded-xl border-2 bg-background pr-28 pl-4 text-base", fe.password ? "border-destructive" : "border-input")}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-2 inline-flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold hover:bg-muted"
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            {show ? "Hide" : "Show"}
          </button>
        </div>
        {fe.password && (
          <p id={`${area}-password-err`} className="mt-2 font-medium text-destructive">
            {fe.password}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-lg font-semibold text-background disabled:opacity-60"
      >
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Sign in
      </button>
    </form>
  );
}
