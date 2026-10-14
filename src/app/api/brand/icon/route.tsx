import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/settings";
import { readableOn, safeHex } from "@/lib/color";

export const dynamic = "force-dynamic";

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "S";
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}

/** Generated favicon / app icon from the store name and accent colour. */
export async function GET(req: Request) {
  const s = await getSettings();
  const size = Math.min(512, Math.max(16, Number(new URL(req.url).searchParams.get("size")) || 64));
  const bg = safeHex(s.branding.accentColor);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          color: readableOn(bg),
          fontSize: size * 0.46,
          fontWeight: 800,
          letterSpacing: -size * 0.02,
          borderRadius: size * 0.22,
        }}
      >
        {initials(s.branding.storeName)}
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=300" } },
  );
}
