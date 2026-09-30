import path from "node:path";

import nextEnv from "@next/env";

// Shared credentials live in the repo-root .env; app-specific overrides go in this app's .env.local
nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, "../.."));

// Public hostname of the Cloudflare R2 bucket holding gallery and team photos, e.g. "media.dsstudio.com.uy"
const mediaHostname = process.env.MEDIA_HOSTNAME;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ds-studio/database", "@ds-studio/messaging"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(mediaHostname ? [{ protocol: "https", hostname: mediaHostname }] : []),
    ],
  },
};

export default nextConfig;
