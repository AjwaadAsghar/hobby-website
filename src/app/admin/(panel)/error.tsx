"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Admin pages keep the sidebar when something fails, and show the error code
 * that matches the entry in Vercel → Logs, so the cause can be found.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center">
      <h1 className="text-3xl font-bold">Something went wrong on this page</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Nothing you saved before this is lost. Try again; if it keeps happening, note the error code below and check the logs.
      </p>
      {error.digest && (
        <p className="mt-4 rounded-xl bg-muted px-4 py-2 font-mono text-sm">
          Error code: <span className="font-semibold">{error.digest}</span>
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="inline-flex h-12 items-center rounded-xl bg-foreground px-6 font-semibold text-background">
          Try again
        </button>
        <Link href="/admin" className="inline-flex h-12 items-center rounded-xl border-2 border-foreground px-6 font-semibold">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
