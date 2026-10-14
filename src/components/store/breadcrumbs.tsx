import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.95rem]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-4 text-muted-foreground" aria-hidden />}
            {it.href ? (
              <Link href={it.href} className="font-medium underline-offset-4 hover:underline">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-muted-foreground">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
