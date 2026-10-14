"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QtyStepper({
  value,
  onChange,
  max,
  min = 1,
  label = "Quantity",
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  min?: number;
  label?: string;
  size?: "md" | "lg";
}) {
  const btn = cn(
    "flex items-center justify-center rounded-full transition hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent",
    size === "lg" ? "size-12" : "size-10",
  );
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center rounded-full border-2 border-input bg-background", size === "lg" ? "h-14" : "h-12")}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-5" aria-hidden />
      </button>
      <span aria-live="polite" className={cn("min-w-10 text-center font-semibold tabular-nums", size === "lg" && "text-lg")}>
        <span className="sr-only">Quantity: </span>
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-5" aria-hidden />
      </button>
    </div>
  );
}
