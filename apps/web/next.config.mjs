import path from "node:path";

import nextEnv from "@next/env";

import { securityHeaders } from "../../config/security-headers.mjs";

// Shared credentials live in the repo-root .env; app-specific overrides go in this app's .env.local
nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, "../.."));

const TURNSTILE = "https://challenges.cloudflare.com";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ds-studio/database", "@ds-studio/messaging"],
  images: {
    remotePatterns: [
      // Cloudflare Images: gallery and barber photos uploaded from the admin
      { protocol: "https", hostname: "imagedelivery.net" },
      // Seeded placeholder barber photos; remove once every barber has a real photo
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: securityHeaders({
        script: [TURNSTILE],
        connect: [TURNSTILE],
        img: ["https://imagedelivery.net", "https://images.unsplash.com"],
        frame: [TURNSTILE, "https://www.openstreetmap.org"],
      }),
    },
  ],
};

export default nextConfig;
