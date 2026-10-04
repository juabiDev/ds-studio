import path from "node:path";

import nextEnv from "@next/env";

// Shared credentials live in the repo-root .env; app-specific overrides go in this app's .env.local
nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, "../.."));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ds-studio/database", "@ds-studio/messaging"],
  images: {
    remotePatterns: [
      {
          protocol: "https",
          hostname: "imagedelivery.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
    },
    ],
  },
};

export default nextConfig;
