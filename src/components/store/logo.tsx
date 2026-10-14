/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Store logo. Uses the uploaded logo when there is one, otherwise a clean
 * text logo built from the store name (so renaming the store "just works").
 */
export function Logo({ name, logoUrl, className, invert, compact }: { name: string; logoUrl?: string; className?: string; invert?: boolean; compact?: boolean }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className={cn("h-10 w-auto max-w-[220px] object-contain", className)} />;
  }
  const words = name.trim().split(/\s+/);
  const first = words[0] ?? name;
  const rest = words.slice(1).join(" ");
  return (
    <span role="img" className={cn("inline-flex items-center gap-2 select-none", className)} aria-label={name}>
      <span aria-hidden className={cn("relative size-9", compact ? "hidden min-[440px]:flex" : "flex")}><span className="flex size-9 items-center justify-center rounded-[10px] bg-brand text-brand-foreground shadow-sm">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15l5-8h6l5 8" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      </span></span>
      <span aria-hidden className={cn("leading-none font-extrabold tracking-tight", compact ? "text-[1.05rem] min-[400px]:text-[1.15rem] sm:text-[1.35rem]" : "text-[1.35rem]", invert ? "text-white" : "text-foreground")}>
        {first}
        {rest && <span className="font-medium italic text-brand-text"> {rest}</span>}
      </span>
    </span>
  );
}
