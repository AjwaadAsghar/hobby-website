/** Top-down plane silhouette pointing right (nose at x=100). */
function PlaneShape() {
  return (
    <svg viewBox="0 0 100 64" className="relative h-auto w-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]" aria-hidden>
      {/* Main wings */}
      <path d="M44 32 L30 3 Q29 0 33 1 L40 3 L60 30 Z" fill="#e4e4e7" />
      <path d="M44 32 L30 61 Q29 64 33 63 L40 61 L60 34 Z" fill="#d4d4d8" />
      {/* Tail */}
      <path d="M10 32 L3 17 Q2 15 5 15 L9 16 L19 30 Z" fill="#e4e4e7" />
      <path d="M10 32 L3 47 Q2 49 5 49 L9 48 L19 34 Z" fill="#d4d4d8" />
      {/* Fuselage */}
      <path d="M4 32 Q4 27 12 27 L84 27 Q98 28 100 32 Q98 36 84 37 L12 37 Q4 37 4 32 Z" fill="#fafafa" />
      {/* Accent stripe + canopy */}
      <rect x="22" y="30" width="50" height="4" rx="2" fill="var(--brand)" />
      <path d="M76 29.5 Q88 30 92 32 Q88 34 76 34.5 Z" fill="#27272a" />
    </svg>
  );
}

/**
 * Two planes take off from the bottom corners, cross behind the headline and
 * fly out of the top. Pure CSS (see `.hero-plane` in globals.css): plays once,
 * costs nothing on first paint and is skipped for reduced motion.
 */
export function HeroPlanes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="hero-plane hero-plane-left">
        <div className="hero-plane-body">
          <span className="hero-contrail" />
          <PlaneShape />
        </div>
      </div>
      <div className="hero-plane hero-plane-right">
        <div className="hero-plane-body">
          <span className="hero-contrail" />
          <PlaneShape />
        </div>
      </div>
    </div>
  );
}
