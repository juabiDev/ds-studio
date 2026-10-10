import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-config";

// No lastModified: a value that changes on every request tells crawlers nothing
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
