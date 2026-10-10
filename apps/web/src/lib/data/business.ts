import "server-only";

import { cache } from "react";

import type { DayOfWeek } from "@ds-studio/database";
import { normalizePhone } from "@ds-studio/database/booking";
import { WEEK_DAYS, type OpeningHoursByDay, type SiteSettingsData } from "@ds-studio/database/settings";
import { getSiteSettings } from "@ds-studio/database/settings-store";

import type { BusinessInfo, OpeningHoursGroup } from "@/types/site";

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

const WHATSAPP_GREETING = "Hola DS STUDIO, quiero consultar un turno";

const shortTime = (time: string) => time.replace(/^0/, "");

/** Merges consecutive days with identical hours: Mon–Sat 9–20 becomes one line. */
const groupHours = (byDay: OpeningHoursByDay): OpeningHoursGroup[] => {
  const groups: OpeningHoursGroup[] = [];

  for (const day of WEEK_DAYS) {
    const hours = byDay[day];
    const last = groups.at(-1);
    if (last && last.opens === (hours?.opens ?? null) && last.closes === (hours?.closes ?? null)) {
      last.days.push(day);
    } else {
      groups.push({ days: [day], opens: hours?.opens ?? null, closes: hours?.closes ?? null, label: "" });
    }
  }

  for (const g of groups) {
    const days = g.days.length === 1 ? DAY_LABELS[g.days[0]] : `${DAY_LABELS[g.days[0]]} – ${DAY_LABELS[g.days.at(-1)!]}`;
    g.label = `${days}: ${g.opens && g.closes ? `${shortTime(g.opens)} – ${shortTime(g.closes)}` : "Cerrado"}`;
  }

  return groups;
};

/** "https://instagram.com/dsstudio.mvd/" -> "@dsstudio.mvd" */
const instagramHandle = (url: string) => {
  try {
    const user = new URL(url).pathname.split("/").find(Boolean);
    return user ? `@${user}` : "Instagram";
  } catch {
    return "Instagram";
  }
};

const toBusinessInfo = (s: SiteSettingsData): BusinessInfo => {
  const e164 = normalizePhone(s.phone);
  const whatsappDigits = normalizePhone(s.whatsapp ?? s.phone).replace("+", "");
  const { latitude: lat, longitude: lng } = s;

  return {
    phone: { display: s.phone, href: `tel:${e164}`, e164 },
    email: s.email,
    whatsappUrl: `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(WHATSAPP_GREETING)}`,
    address: {
      street: s.street,
      neighborhood: s.neighborhood,
      postalCode: s.postalCode,
      city: s.city,
      countryName: "Uruguay",
      country: "UY",
    },
    geo: { latitude: lat, longitude: lng },
    mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    mapEmbedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.0165}%2C${lat - 0.009}%2C${lng + 0.0165}%2C${lat + 0.009}&layer=mapnik&marker=${lat}%2C${lng}`,
    instagram: s.instagramUrl ? { url: s.instagramUrl, handle: instagramHandle(s.instagramUrl) } : null,
    facebookUrl: s.facebookUrl,
    hoursByDay: s.openingHours,
    hours: groupHours(s.openingHours),
  };
};

// cache(): the page and the JSON-LD both need it; one database read per render
export const getBusinessInfo = cache(async () => toBusinessInfo(await getSiteSettings()));
