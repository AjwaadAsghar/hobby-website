import { getSettings } from "@/lib/settings";
import { ogCard, OG_SIZE } from "@/lib/og";

export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Store preview";

export default async function Image() {
  const s = await getSettings();
  return ogCard({ storeName: s.branding.storeName, accent: s.branding.accentColor, title: s.homepage.heroTitle, subtitle: s.branding.tagline });
}
