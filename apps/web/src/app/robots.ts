import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

// Indexing stays disabled while the site isn't live in production.
// Flip this to `allow: "/"` (and remove `robots.index/follow` in layout.tsx)
// once the real domain is ready to go public.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
