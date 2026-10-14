"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<"name" | "email" | "phone" | "message" | "form", string>>;

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setErrors({});
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = (await res.json()) as { ok?: boolean; errors?: Errors; error?: string };
      if (!res.ok || !data.ok) {
        setErrors(data.errors ?? { form: data.error ?? "Something went wrong. Please try again." });
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setErrors({ form: "We could not reach the server. Please check your connection." });
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="flex items-center gap-3 rounded-2xl bg-success/10 p-5 text-lg font-medium text-success">
        <CheckCircle2 className="size-6 shrink-0" aria-hidden /> Thank you! Your message has been sent. We will get back to you soon.
      </p>
    );
  }

  const field = (name: keyof Errors) =>
    cn("w-full rounded-xl border-2 bg-background px-4 text-base", errors[name] ? "border-destructive" : "border-input");

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {errors.form && (
        <p role="alert" className="rounded-xl bg-destructive/5 p-4 font-medium text-destructive">
          {errors.form}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-lg font-semibold">
            Your name
          </label>
          <input id="c-name" name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-err" : undefined} className={cn(field("name"), "h-13")} />
          {errors.name && <p id="c-name-err" className="mt-2 font-medium text-destructive">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="c-phone" className="mb-1.5 block text-lg font-semibold">
            Phone <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="c-phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "c-phone-err" : undefined} className={cn(field("phone"), "h-13")} />
          {errors.phone && <p id="c-phone-err" className="mt-2 font-medium text-destructive">{errors.phone}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="c-email" className="mb-1.5 block text-lg font-semibold">
          Email <span className="font-normal text-muted-foreground">(optional, but we need a phone or email to reply)</span>
        </label>
        <input id="c-email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-err" : undefined} className={cn(field("email"), "h-13")} />
        {errors.email && <p id="c-email-err" className="mt-2 font-medium text-destructive">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-lg font-semibold">
          Message
        </label>
        <textarea id="c-message" name="message" rows={5} aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-message-err" : undefined} className={cn(field("message"), "py-3")} />
        {errors.message && <p id="c-message-err" className="mt-2 font-medium text-destructive">{errors.message}</p>}
      </div>
      {/* Honeypot for bots - hidden from people and screen readers */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <button type="submit" disabled={state === "sending"} className="inline-flex h-14 items-center gap-2 rounded-xl bg-brand px-8 text-lg font-semibold text-brand-foreground disabled:opacity-60">
        {state === "sending" && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Send message
      </button>
    </form>
  );
}
