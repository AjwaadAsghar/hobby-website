"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** "Live" pill that flashes when the bell reports a new order. */
export function LiveIndicator() {
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onNew = (e: Event) => {
      const items = (e as CustomEvent<{ type: string; title: string }[]>).detail;
      const order = items.find((i) => i.type === "NEW_ORDER");
      if (!order) return;
      setFlash(order.title);
      clearTimeout(timer);
      timer = setTimeout(() => setFlash(null), 20000);
    };
    window.addEventListener("admin:new-notifications", onNew);
    return () => {
      window.removeEventListener("admin:new-notifications", onNew);
      clearTimeout(timer);
    };
  }, []);
  return (
    <span
      role="status"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
        flash ? "border-brand bg-brand text-brand-foreground" : "bg-background",
      )}
    >
      <span className="relative flex size-2.5">
        <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", flash ? "bg-white" : "bg-emerald-500")} />
        <span className={cn("relative inline-flex size-2.5 rounded-full", flash ? "bg-white" : "bg-emerald-500")} />
      </span>
      {flash ? `${flash} just arrived!` : "Live - watching for new orders"}
    </span>
  );
}
