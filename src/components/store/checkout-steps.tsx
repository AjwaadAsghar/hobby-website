import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Cart", "Details", "Payment", "Done"];

/** 1. Cart → 2. Details → 3. Payment → 4. Done */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold",
                  done && "border-success bg-success text-white",
                  active && "border-brand bg-brand text-brand-foreground",
                  !done && !active && "border-input text-muted-foreground",
                )}
              >
                {done ? <Check className="size-5" aria-hidden /> : n}
              </span>
              <span className={cn("text-[0.95rem] font-semibold sm:text-base", !done && !active && "text-muted-foreground")}>
                {label}
                <span className="sr-only">{done ? " (completed)" : active ? " (current step)" : ""}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
