import path from "node:path";

import nextEnv from "@next/env";

import { securityHeaders } from "../../config/security-headers.mjs";

// Shared credentials live in the repo-root .env; app-specific overrides go in this app's .env.local
nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, "../.."));

const siteOrigin = () => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").origin;
  } catch {
    return "";
  }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ds-studio/auth", "@ds-studio/database", "@ds-studio/messaging", "@ds-studio/ui"],
  experimental: {
    // Reuse a visited tab for 30s instead of re-rendering it on every click. Server actions
    // call revalidatePath and AutoRefresh calls router.refresh, which both bypass this cache.
    staleTimes: { dynamic: 30 },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: securityHeaders({
        noindex: true,
        // Photos go straight from the browser to Cloudflare Images (one-time upload URLs)
        connect: ["https://upload.imagedelivery.net"],
        // The public site's origin serves the seeded gallery photos (/images/...)
        img: ["https://imagedelivery.net", "https://images.unsplash.com", siteOrigin()].filter(Boolean),
      }),
    },
  ],
};

export default nextConfig;
