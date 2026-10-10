import type { MetadataRoute } from "next";

import { SITE_INDEXABLE, SITE_URL } from "@/lib/site-config";

// Controlled by SITE_INDEXING (see site-config.ts); the layout's robots meta follows the same switch.
export default function robots(): MetadataRoute.Robots {
  if (!SITE_INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    // Cancel pages stay crawlable on purpose: they carry noindex, which crawlers only see if they can fetch them
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
