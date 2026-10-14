"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => null });

/** Decides whether this device should get the 3D scene at all. */
function canRun3D(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return false;
  if ((nav.hardwareConcurrency ?? 4) <= 2) return false;
  if ((nav.deviceMemory ?? 4) <= 2) return false;
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) return false;
  } catch {
    return false;
  }
  return true;
}

/** Static drone illustration: the fallback for reduced motion / weak devices, and the placeholder while 3D loads. */
export function HeroFallback({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 600 420" className="h-full w-full" role="img" aria-label="Illustration of a camera drone">
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="300" cy="230" rx="280" ry="180" fill="url(#hero-glow)" />
      <ellipse cx="300" cy="380" rx="170" ry="16" fill="#000" opacity="0.1" />
      <g stroke="#26262b" strokeWidth="20" strokeLinecap="round">
        <line x1="170" y1="150" x2="430" y2="290" />
        <line x1="430" y1="150" x2="170" y2="290" />
      </g>
      {[
        [170, 150],
        [430, 150],
        [170, 290],
        [430, 290],
      ].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y - 18} rx="95" ry="12" fill="#3f3f46" opacity="0.25" />
          <rect x={x - 16} y={y - 22} width="32" height="30" rx="8" fill="#a1a1aa" />
          <rect x={x - 16} y={y - 26} width="32" height="8" rx="4" fill={i < 2 ? accent : "#18181b"} />
        </g>
      ))}
      <rect x="230" y="180" width="140" height="80" rx="24" fill="#26262b" />
      <rect x="265" y="172" width="70" height="14" rx="5" fill={accent} />
      <circle cx="300" cy="275" r="20" fill="#18181b" />
      <circle cx="300" cy="275" r="8" fill={accent} />
    </svg>
  );
}

export function Hero3D({ accent, modelUrl }: { accent: string; modelUrl?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canRun3D()) return;
    // The 3D scene never competes with the first paint: on touch devices it
    // starts after the first interaction; on desktop after the first
    // interaction or a few idle seconds, whichever comes first.
    const start = () => setEnabled(true);
    const events = ["pointermove", "pointerdown", "touchstart", "scroll", "keydown", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const timer = coarse ? undefined : window.setTimeout(start, 3500);
    return () => {
      events.forEach((e) => window.removeEventListener(e, start));
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, [enabled]);

  return (
    <div ref={ref} className="relative h-full w-full">
      <div className={`absolute inset-0 transition-opacity duration-700 ${enabled && ready ? "opacity-0" : "opacity-100"}`}>
        <HeroFallback accent={accent} />
      </div>
      {enabled && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
          <HeroScene accent={accent} modelUrl={modelUrl || undefined} active={visible} />
        </div>
      )}
    </div>
  );
}
