"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Item = { id: string; type: string; title: string; body: string; link: string | null; isRead: boolean; createdAt: string };

const POLL_MS = 12000;

/** Short two-tone chime made with Web Audio - no sound file needed. */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    /* audio blocked until the user interacts with the page */
  }
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [sound, setSound] = useState(true);
  const seen = useRef<Set<string> | null>(null);
  const soundRef = useRef(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem("admin-sound") !== "off";
      soundRef.current = v;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSound(v);
    } catch {}
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { unread: number; items: Item[] };
      setItems(data.items);
      setUnread(data.unread);
      if (seen.current === null) {
        seen.current = new Set(data.items.map((i) => i.id));
        return;
      }
      const fresh = data.items.filter((i) => !seen.current!.has(i.id));
      fresh.forEach((i) => seen.current!.add(i.id));
      if (fresh.length) {
        const important = fresh.filter((i) => i.type === "NEW_ORDER" || i.type === "PAYMENT_PROOF");
        for (const i of fresh.slice(0, 3)) {
          toast(i.title, {
            description: i.body,
            duration: i.type === "NEW_ORDER" ? 15000 : 8000,
            action: i.link ? { label: "Open", onClick: () => router.push(i.link!) } : undefined,
          });
        }
        if (important.length && soundRef.current) chime();
        if (important.length) router.refresh();
        window.dispatchEvent(new CustomEvent("admin:new-notifications", { detail: fresh }));
      }
    } catch {
      /* offline - try again next time */
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  async function markAll() {
    await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setUnread(0);
    setItems((x) => x.map((i) => ({ ...i, isRead: true })));
  }

  async function markOne(id: string) {
    await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
    setItems((x) => x.map((i) => (i.id === id ? { ...i, isRead: true } : i)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative inline-flex h-11 items-center gap-2 rounded-xl px-3 font-medium hover:bg-muted" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="size-5" aria-hidden />
          <span className="hidden sm:inline">Alerts</span>
          {unread > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-brand-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,400px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const v = !sound;
                setSound(v);
                soundRef.current = v;
                try {
                  localStorage.setItem("admin-sound", v ? "on" : "off");
                } catch {}
                if (v) chime();
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium hover:bg-muted"
              aria-pressed={sound}
            >
              {sound ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
              Sound {sound ? "on" : "off"}
            </button>
            {unread > 0 && (
              <button onClick={markAll} className="h-9 rounded-lg px-2 text-sm font-medium hover:bg-muted">
                Mark all read
              </button>
            )}
          </div>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">No notifications yet.</li>}
          {items.map((i) => (
            <li key={i.id} className={cn("border-b last:border-0", !i.isRead && "bg-brand-soft/60")}>
              <Link href={i.link ?? "/admin"} onClick={() => !i.isRead && markOne(i.id)} className="block px-4 py-3 hover:bg-muted">
                <p className="flex items-center gap-2 font-semibold">
                  {!i.isRead && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                  {i.title}
                </p>
                {i.body && <p className="text-sm text-muted-foreground">{i.body}</p>}
                <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(i.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
