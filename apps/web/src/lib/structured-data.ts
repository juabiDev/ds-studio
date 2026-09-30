import { PRICE_RANGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-config";
import type { BusinessInfo } from "@/types/site";

const toSchemaDay = (day: string) => `https://schema.org/${day.charAt(0)}${day.slice(1).toLowerCase()}`;

// Google has no BarberShop type; HairSalon is the closest LocalBusiness subtype.
export const localBusinessJsonLd = (business: BusinessInfo) => ({
  "@context": "https://schema.org",
  "@type": "HairSalon",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  telephone: business.phone.e164,
  email: business.email,
  priceRange: PRICE_RANGE,
  address: {
    "@type": "PostalAddress",
    streetAddress: business.address.street,
    addressLocality: business.address.city,
    addressCountry: business.address.country,
  },
  geo: { "@type": "GeoCoordinates", ...business.geo },
  openingHoursSpecification: business.hours.filter((h) => h.opens && h.closes).map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days.map(toSchemaDay),
    opens: h.opens,
    closes: h.closes,
  })),
  sameAs: [business.instagram?.url, business.facebookUrl].filter(Boolean),
});
