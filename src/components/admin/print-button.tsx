"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-black px-5 font-semibold text-white">
      <Printer className="size-4" aria-hidden /> Print
    </button>
  );
}
