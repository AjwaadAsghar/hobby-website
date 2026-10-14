import { ImageResponse } from "next/og";
import { readableOn, safeHex } from "@/lib/color";

export const OG_SIZE = { width: 1200, height: 630 };

/** Branded social-share card (text only, so it works with any product image format). */
export function ogCard(opts: { storeName: string; accent: string; title: string; subtitle?: string; price?: string; badge?: string; image?: string | null }) {
  const accent = safeHex(opts.accent);
  const fg = readableOn(accent);
  const showImage = opts.image && /^https?:\/\//.test(opts.image) && !opts.image.endsWith(".svg");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0b0d", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: accent, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800 }}>
              {opts.storeName.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>{opts.storeName}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {opts.badge && (
              <div style={{ display: "flex" }}>
                <div style={{ background: accent, color: fg, fontSize: 24, fontWeight: 700, padding: "8px 18px", borderRadius: 999 }}>{opts.badge}</div>
              </div>
            )}
            <div style={{ fontSize: opts.title.length > 50 ? 54 : 66, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>{opts.title}</div>
            {opts.subtitle && <div style={{ fontSize: 28, color: "#d4d4d8", lineHeight: 1.35 }}>{opts.subtitle.slice(0, 140)}</div>}
          </div>
          {opts.price ? <div style={{ fontSize: 44, fontWeight: 800, color: "#fff" }}>{opts.price}</div> : <div style={{ height: 4, width: 120, background: accent }} />}
        </div>
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={opts.image!} width={480} height={630} style={{ objectFit: "cover" }} />
        )}
      </div>
    ),
    OG_SIZE,
  );
}
