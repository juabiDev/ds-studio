import { localBusinessJsonLd } from "@/lib/structured-data";
import type { ServiceOption } from "@/types/booking";
import type { BusinessInfo } from "@/types/site";

interface LocalBusinessJsonLdProps {
  business: BusinessInfo;
  services: ServiceOption[];
}

// "<" is escaped so business data can never close the script tag
export const LocalBusinessJsonLd = ({ business, services }: LocalBusinessJsonLdProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(business, services)).replace(/</g, "\\u003c") }}
  />
);
