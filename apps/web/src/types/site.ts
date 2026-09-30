import type { DayOfWeek } from "@ds-studio/database";
import type { OpeningHoursByDay } from "@ds-studio/database/settings";

/** Consecutive days sharing the same hours, e.g. "Lunes – Sábado: 9:00 – 20:00". */
export interface OpeningHoursGroup {
  days: DayOfWeek[];
  /** null when closed */
  opens: string | null;
  closes: string | null;
  label: string;
}

/** Business details from the admin "Ajustes" page, ready to render. */
export interface BusinessInfo {
  phone: { display: string; href: string; e164: string };
  email: string;
  whatsappUrl: string;
  address: { street: string; city: string; countryName: string; country: string };
  geo: { latitude: number; longitude: number };
  mapsUrl: string;
  mapEmbedUrl: string;
  instagram: { url: string; handle: string } | null;
  facebookUrl: string | null;
  hoursByDay: OpeningHoursByDay;
  hours: OpeningHoursGroup[];
}

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  category: string;
}
