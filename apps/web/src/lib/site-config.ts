/**
 * Never throws: a missing variable must not take the site down. In production it falls back to
 * the service's Railway domain (set by Railway) and logs loudly, since canonical/OG/sitemap URLs
 * should point at the real domain.
 */
const resolveSiteUrl = () => {
  // Without the trailing slash, so `${SITE_URL}/path` never doubles it
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (url) return url;

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (process.env.NODE_ENV === "production") {
    console.error("[site-config] NEXT_PUBLIC_SITE_URL is not set; SEO links use a fallback domain");
  }
  return railwayDomain ? `https://${railwayDomain}` : "http://localhost:3000";
};

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "DS STUDIO";

export const SITE_DESCRIPTION =
  "Barbería urbana de precisión en Montevideo, Uruguay. Cortes clásicos, fade, barba y reserva de turnos online.";

export const FOUNDING_YEAR = "2018";

/**
 * Provider details that Decreto 167/021 (MERCOSUR e-commerce rules) asks to show before a booking.
 * Shown on /terminos and /privacidad. TODO before launch: replace the placeholders (docs/go-live.md).
 */
export const LEGAL_ENTITY = {
  name: "[RAZÓN SOCIAL]",
  rut: "[RUT]",
};

/**
 * Search engines may index the site only when SITE_INDEXING=on. Off by default so previews and
 * the Railway domain never get indexed; turn it on in production once the real domain is live.
 */
export const SITE_INDEXABLE = process.env.SITE_INDEXING === "on";

/** "Barbería en Centro, Montevideo": the phrase people search, with the barrio and city from Ajustes. */
export const localKeyword = (neighborhood: string | null, city: string) =>
  `Barbería en ${neighborhood ? `${neighborhood}, ` : ""}${city}`;

// Contact details, address and opening hours are edited from the admin "Ajustes" page (see lib/data/business.ts).
export const PRICE_RANGE = "$$";
