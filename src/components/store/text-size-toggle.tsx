"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sizes = [
  { value: "normal", label: "A", name: "Normal text" },
  { value: "large", label: "A", name: "Large text" },
  { value: "xl", label: "A", name: "Extra large text" },
] as const;

type Size = (typeof sizes)[number]["value"];

function apply(size: Size) {
  const el = document.documentElement;
  if (size === "normal") delete el.dataset.textSize;
  else el.dataset.textSize = size;
  try {
    localStorage.setItem("text-size", size);
  } catch {
    /* private mode - size still applies for this visit */
  }
}

export function TextSizeToggle({ className }: { className?: string }) {
  const [size, setSize] = useState<Size>("normal");

  useEffect(() => {
    // The inline script in <head> already applied the saved size; mirror it here.
    const saved = document.documentElement.dataset.textSize as Size | undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setSize(saved);
  }, []);

  return (
    <div role="group" aria-label="Text size" className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium">Text size</span>
      <div className="flex rounded-lg border border-input bg-background p-0.5 text-foreground">
        {sizes.map((s, i) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={size === s.value}
            aria-label={s.name}
            title={s.name}
            onClick={() => {
              setSize(s.value);
              apply(s.value);
            }}
            className={cn(
              "flex h-8 min-w-9 items-center justify-center rounded-md px-2 leading-none font-bold transition-colors",
              size === s.value ? "bg-foreground text-background" : "hover:bg-muted",
            )}
            style={{ fontSize: `${0.85 + i * 0.18}rem` }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
