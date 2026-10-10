import type { Metadata, Viewport } from "next";

import { getBusinessInfo } from "@/lib/data/business";
import { fontVariables } from "@/lib/fonts";
import { localKeyword, SITE_DESCRIPTION, SITE_INDEXABLE, SITE_NAME, SITE_URL } from "@/lib/site-config";

import "./globals.css";

/** Barrio and city from Ajustes; generic values when settings can't be read. */
const loadPlace = async () => {
  try {
    const { neighborhood, city } = (await getBusinessInfo()).address;
    return { neighborhood, city };
  } catch (error) {
    // Metadata must never take a page down; fall back to the generic "Barbería en Montevideo"
    console.error("[metadata] settings unavailable", error);
    return { neighborhood: null, city: "Montevideo" };
  }
};

export const generateMetadata = async (): Promise<Metadata> => {
  const { neighborhood, city } = await loadPlace();
  // "DS STUDIO — Barbería en Centro, Montevideo": brand + the exact local search phrase
  const title = `${SITE_NAME} — ${localKeyword(neighborhood, city)}`;
  const description = neighborhood
    ? `Barbería urbana de precisión en ${neighborhood}, ${city}. Cortes clásicos, fade, barba y reserva de turnos online.`
    : SITE_DESCRIPTION;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — ${SITE_NAME}` },
    description,
    // SITE_INDEXING=on in production once the real domain is live (robots.ts follows the same switch)
    robots: { index: SITE_INDEXABLE, follow: SITE_INDEXABLE },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "es_UY",
      type: "website",
    },
    // Canonical and og:url are set per page (home in page.tsx), so other routes never claim to be the home.
    // The image is app/opengraph-image.jpg (kept under ~300 KB: WhatsApp drops larger previews)
    twitter: { card: "summary_large_image" },
  };
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets content use the iPhone safe areas (env(safe-area-inset-*)) for the bottom action bars
  viewportFit: "cover",
  themeColor: "#0d0d0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
