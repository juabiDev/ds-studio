import { FOUNDING_YEAR, PRICE_RANGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-config";
import type { ServiceOption } from "@/types/booking";
import type { BusinessInfo } from "@/types/site";

const toSchemaDay = (day: string) => `https://schema.org/${day.charAt(0)}${day.slice(1).toLowerCase()}`;

// Google has no BarberShop type; HairSalon is the closest LocalBusiness subtype.
export const localBusinessJsonLd = (business: BusinessInfo, services: ServiceOption[]) => ({
  "@context": "https://schema.org",
  "@type": "HairSalon",
  "@id": `${SITE_URL}/#business`,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: [`${SITE_URL}/opengraph-image.jpg`, `${SITE_URL}/images/hero.jpg`, `${SITE_URL}/images/local.jpg`],
  logo: `${SITE_URL}/icon.svg`,
  telephone: business.phone.e164,
  email: business.email,
  priceRange: PRICE_RANGE,
  foundingDate: FOUNDING_YEAR,
  currenciesAccepted: "UYU",
  paymentAccepted: "Efectivo, tarjeta de débito, tarjeta de crédito, transferencia bancaria, Mercado Pago",
  acceptsReservations: true,
  address: {
    "@type": "PostalAddress",
    streetAddress: business.address.street,
    ...(business.address.postalCode && { postalCode: business.address.postalCode }),
    addressLocality: business.address.city,
    addressRegion: business.address.city,
    addressCountry: business.address.country,
  },
  geo: { "@type": "GeoCoordinates", ...business.geo },
  hasMap: business.mapsUrl,
  ...(business.address.neighborhood && {
    areaServed: { "@type": "Place", name: `${business.address.neighborhood}, ${business.address.city}` },
  }),
  openingHoursSpecification: business.hours.filter((h) => h.opens && h.closes).map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days.map(toSchemaDay),
    opens: h.opens,
    closes: h.closes,
  })),
  ...(services.length > 0 && {
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name },
        ...(s.priceAmount !== null && { price: s.priceAmount, priceCurrency: "UYU" }),
      })),
    },
  }),
  potentialAction: {
    "@type": "ReserveAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/#agendar` },
  },
  sameAs: [business.instagram?.url, business.facebookUrl].filter(Boolean),
});
