import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: the store reads settings, stock and
  // prices from the database on every request so admin changes are instant.
  // See DECISIONS.md.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // The development machine is very low on disk space; Turbopack's on-disk
    // cache can grow to several GB. Re-enable for faster restarts if you have room.
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
  serverExternalPackages:["@prisma/client", "web-push", "exceljs", "sanitize-html"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/admin-sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/admin" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;
