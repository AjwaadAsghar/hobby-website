"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { testIntegration, type TestResult } from "./actions";
import { cn } from "@/lib/utils";

export function TestButton({ service, label }: { service: string; label: string }) {
  const [result, setResult] = useState<TestResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        onClick={() => start(async () => setResult(await testIntegration(service)))}
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {label}
      </button>
      {result && (
        <p role="status" className={cn("mt-2 text-sm font-medium", result.ok ? "text-success" : "text-destructive")}>
          {result.message}
        </p>
      )}
    </div>
  );
}
