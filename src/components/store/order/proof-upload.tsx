"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

export function ProofUpload({ number, token, phone }: { number: number; token?: string; phone?: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setState("error");
      setMessage("Please choose a screenshot first.");
      return;
    }
    setState("uploading");
    const fd = new FormData();
    fd.set("number", String(number));
    if (token) fd.set("token", token);
    if (phone) fd.set("phone", phone);
    fd.set("file", file);
    try {
      const res = await fetch("/api/orders/proof", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Upload failed. Please try again.");
      setState("done");
      setMessage("Thank you! We have received your screenshot and will confirm your payment soon.");
      router.refresh();
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl bg-success/10 p-4 text-lg font-medium text-success">
        <CheckCircle2 className="size-6 shrink-0" aria-hidden /> {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-input bg-background px-4 py-3 hover:bg-muted">
        <Upload className="size-5 shrink-0" aria-hidden />
        <span className="font-medium">{file ? file.name : "Choose your payment screenshot"}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <button
        type="submit"
        disabled={state === "uploading"}
        className="inline-flex h-12 items-center gap-2 rounded-xl bg-foreground px-6 font-semibold text-background disabled:opacity-60"
      >
        {state === "uploading" && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Upload screenshot
      </button>
      {state === "error" && (
        <p role="alert" className="font-medium text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}
