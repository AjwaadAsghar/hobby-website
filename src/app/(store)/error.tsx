"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-store flex flex-col items-center py-24 text-center">
      <h1 className="text-3xl font-bold">Sorry, something went wrong</h1>
      <p className="mt-3 max-w-lg text-lg text-muted-foreground">
        This page did not load properly. Please try again. If it keeps happening, contact us on WhatsApp and we will help.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="inline-flex h-12 items-center rounded-xl bg-foreground px-6 font-semibold text-background">
          Try again
        </button>
        <Link href="/" className="inline-flex h-12 items-center rounded-xl border-2 border-foreground px-6 font-semibold">
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
