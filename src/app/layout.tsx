import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { getSettings, siteUrl } from "@/lib/settings";
import { readableOn, safeHex } from "@/lib/color";
import "./globals.css";

// Settings, prices and stock come from the database on every request.
export const dynamic = "force-dynamic";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s.branding.storeName;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${name} – ${s.branding.tagline}`, template: `%s | ${name}` },
    description: s.homepage.heroSubtitle,
    applicationName: name,
    openGraph: { siteName: name, type: "website", locale: "en_PK" },
    twitter: { card: "summary_large_image" },
    icons: { icon: s.branding.faviconUrl || "/api/brand/icon", apple: s.branding.faviconUrl || "/api/brand/icon?size=180" },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const s = await getSettings();
  return { themeColor: safeHex(s.branding.accentColor), width: "device-width", initialScale: 1 };
}

/** Applies the saved text size before first paint (no flash). */
const textSizeScript = `try{var t=localStorage.getItem("text-size");if(t==="large"||t==="xl")document.documentElement.dataset.textSize=t}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const s = await getSettings();
  const brand = safeHex(s.branding.accentColor);
  const store = {
    storeName: s.branding.storeName,
    tagline: s.branding.tagline,
    logoUrl: s.branding.logoUrl,
    whatsapp: s.contact.whatsapp,
    phone: s.contact.phone,
    email: s.contact.email,
    currency: s.commerce.currency,
    locale: s.commerce.locale,
    freeShippingThreshold: s.commerce.freeShippingThreshold,
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: textSizeScript }} />
        <style>{`:root{--brand:${brand};--brand-foreground:${readableOn(brand)}}`}</style>
      </head>
      <body className="flex min-h-full flex-col">
        <Providers store={store}>{children}</Providers>
      </body>
    </html>
  );
}
