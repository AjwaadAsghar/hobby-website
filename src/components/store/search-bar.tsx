"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMoney } from "@/components/store-context";
import { ProductImage } from "@/components/store/product-image";

type Suggestion = { id: string; slug: string; title: string; price: number; image: string | null; brand: string };

/** Large, typo-tolerant search with live suggestions (ARIA combobox pattern). */
export function SearchBar({ className, initialQuery = "", autoFocus }: { className?: string; initialQuery?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const money = useMoney();
  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = (await res.json()) as { results: Suggestion[] };
          setItems(data.results);
          setActive(-1);
        }
      } catch {
        /* request aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(slug: string) {
    setOpen(false);
    router.push(`/product/${slug}`);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (active >= 0 && items[active]) return go(items[active].slug);
    setOpen(false);
    const term = q.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/shop");
  }

  const showList = open && q.trim().length >= 2;
  const visible = q.trim().length >= 2 ? items : [];

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <form role="search" onSubmit={submit} className="relative">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id={`${listId}-input`}
          type="search"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search cars, drones, batteries…"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(visible.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          className="h-13 w-full rounded-full border-2 border-input bg-background pr-28 pl-12 text-base shadow-sm outline-none placeholder:text-muted-foreground focus:border-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          className="absolute top-1.5 right-1.5 bottom-1.5 inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 font-semibold text-background hover:opacity-90"
        >
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Search
        </button>
      </form>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-auto rounded-2xl border bg-popover shadow-xl"
        >
          {visible.length === 0 && (
            <li role="option" aria-selected={false} aria-disabled className="px-5 py-4 text-muted-foreground">
              {loading ? "Searching…" : "No quick matches. Press Search to see all results."}
            </li>
          )}
          {visible.map((it, i) => (
            <li
              key={it.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={active === i}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                go(it.slug);
              }}
              className={cn("flex cursor-pointer items-center gap-4 px-4 py-3", active === i && "bg-muted")}
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <ProductImage src={it.image} alt="" sizes="56px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{it.title}</span>
                <span className="block text-sm text-muted-foreground">{it.brand}</span>
              </span>
              <span className="font-semibold whitespace-nowrap">{money(it.price)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
