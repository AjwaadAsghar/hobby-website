"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "loading" | "unsupported" | "no-key" | "denied" | "off" | "on";

/** Turns browser push notifications on/off for this device (installable admin PWA). */
export function PushToggle({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (!publicKey) return setState("no-key");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin/" });
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [publicKey]);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin/" });
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const res = await fetch("/api/admin/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error("Could not save the subscription.");
      setState("on");
      toast.success("Notifications are on for this device.");
    } catch (err) {
      toast.error((err as Error).message || "Could not turn on notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  const messages: Partial<Record<State, string>> = {
    unsupported: "This browser does not support push notifications. On iPhone, first add the admin to your Home Screen (Share → Add to Home Screen), then open it from there.",
    "no-key": "Push keys are missing. Run `npm run vapid` and add the keys to your environment variables.",
    denied: "Notifications are blocked for this site. Allow them in your browser's site settings, then reload.",
  };

  if (state === "loading") return <p className="text-muted-foreground">Checking this device…</p>;
  if (messages[state]) return <p className="rounded-xl bg-muted p-3 text-sm">{messages[state]}</p>;
  return state === "on" ? (
    <button onClick={disable} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted disabled:opacity-50">
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BellOff className="size-4" aria-hidden />} Turn off on this device
    </button>
  ) : (
    <button onClick={enable} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-brand-foreground disabled:opacity-50">
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BellRing className="size-4" aria-hidden />} Turn on notifications on this device
    </button>
  );
}
