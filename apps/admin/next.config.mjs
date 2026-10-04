import path from "node:path";

import nextEnv from "@next/env";

// Shared credentials live in the repo-root .env; app-specific overrides go in this app's .env.local
nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, "../.."));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ds-studio/auth", "@ds-studio/database", "@ds-studio/messaging", "@ds-studio/ui"],
  experimental: {
    // Reuse a visited tab for 30s instead of re-rendering it on every click. Server actions
    // call revalidatePath and AutoRefresh calls router.refresh, which both bypass this cache.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
