"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { changeLoginName, type LoginNameState } from "./actions";
import { cn } from "@/lib/utils";

export function LoginNameForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState<LoginNameState, FormData>(changeLoginName, {});
  return (
    <form action={action} className="space-y-3" noValidate>
      <label htmlFor="login-name" className="block font-semibold">
        Sign-in name
      </label>
      <p id="login-name-hint" className="text-muted-foreground">
        What you type in the first box when you sign in. An email address, or a simple username like <strong>admin</strong>.
      </p>
      <input
        id="login-name"
        name="login"
        defaultValue={current}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={!!state.error}
        aria-describedby={["login-name-hint", state.error && "login-name-err"].filter(Boolean).join(" ")}
        className={cn("h-12 w-full rounded-xl border-2 bg-background px-4", state.error ? "border-destructive" : "border-input")}
      />
      {state.error && <p id="login-name-err" className="font-medium text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="font-medium text-success">{state.ok}</p>}
      <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-foreground font-semibold disabled:opacity-60">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Save sign-in name
      </button>
    </form>
  );
}
