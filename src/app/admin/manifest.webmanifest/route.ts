import { getSettings } from "@/lib/settings";
import { safeHex } from "@/lib/color";

/** Web app manifest so the admin can be installed on a phone or desktop (PWA). */
export async function GET() {
  const s = await getSettings();
  const manifest = {
    name: `${s.branding.storeName} Admin`,
    short_name: `${s.branding.storeName.split(" ")[0]} Admin`,
    description: `Orders and alerts for ${s.branding.storeName}`,
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: safeHex(s.branding.accentColor),
    icons: [
      { src: "/api/brand/icon?size=192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/brand/icon?size=512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-cache" } });
}
