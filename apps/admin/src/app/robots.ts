import type { MetadataRoute } from "next";

// Staff-only app: never crawled (the X-Robots-Tag header in next.config.mjs covers every response too)
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
