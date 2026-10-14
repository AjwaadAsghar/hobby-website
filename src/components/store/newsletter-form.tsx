"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewsletterForm({ dark, className }: { dark?: boolean; className?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setState("done");
      setMessage("Thank you! You are on the list.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("We could not reach the server. Please check your connection.");
    }
  }

  return (
    <form onSubmit={submit} className={cn("w-full", className)} noValidate>
      <label htmlFor="newsletter-email" className="mb-2 block font-medium">
        Your email address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={state === "error"}
          aria-describedby="newsletter-msg"
          placeholder="name@example.com"
          className={cn(
            "h-12 flex-1 rounded-xl border-2 px-4 text-base outline-none",
            dark ? "border-white/30 bg-white/10 text-white placeholder:text-white/70 focus:border-white" : "border-input bg-background focus:border-foreground",
          )}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 font-semibold text-brand-foreground hover:brightness-110 disabled:opacity-60"
        >
          {state === "loading" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Subscribe
        </button>
      </div>
      <p id="newsletter-msg" role="status" className={cn("mt-2 min-h-6 text-[0.95rem]", state === "error" && (dark ? "text-red-300" : "text-destructive"))}>
        {message}
      </p>
    </form>
  );
}
