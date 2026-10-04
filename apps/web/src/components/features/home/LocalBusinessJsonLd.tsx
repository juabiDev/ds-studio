import { localBusinessJsonLd } from "@/lib/structured-data";
import type { BusinessInfo } from "@/types/site";

// "<" is escaped so business data can never close the script tag
export const LocalBusinessJsonLd = ({ business }: { business: BusinessInfo }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(business)).replace(/</g, "\\u003c") }}
  />
);
