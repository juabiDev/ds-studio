// Shared by the admin (validates saves), the public site (reads) and the seed. No database access here
// so it also runs outside Next.js; queries live in settings-store.ts.

import { z } from "zod";

export const WEEK_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida");

const dayHoursSchema = z
  .object({ opens: time, closes: time })
  .refine((h) => h.opens < h.closes, { message: "El cierre tiene que ser después de la apertura." })
  .nullable();

/** Every day of the week is required; null means closed. */
export const openingHoursSchema = z.record(z.enum(WEEK_DAYS), dayHoursSchema);

const phone = z.string().trim().regex(/^\+?[\d\s-]{8,20}$/, "Teléfono inválido");

// Empty inputs mean "not set"; links must be https so they can't carry javascript: URLs
const optionalHttpsUrl = z
  .union([z.literal(""), z.url({ protocol: /^https$/, error: "Tiene que ser un link https://" })])
  .transform((v) => v || null);

export const siteSettingsSchema = z.object({
  phone,
  whatsapp: z.union([z.literal(""), phone]).transform((v) => v || null),
  email: z.email("Email inválido"),
  street: z.string().trim().min(3, "Ingresá la dirección").max(120),
  city: z.string().trim().min(2, "Ingresá la ciudad").max(60),
  latitude: z.number({ error: "Coordenadas inválidas" }).min(-90, "Coordenadas inválidas").max(90, "Coordenadas inválidas"),
  longitude: z.number({ error: "Coordenadas inválidas" }).min(-180, "Coordenadas inválidas").max(180, "Coordenadas inválidas"),
  instagramUrl: optionalHttpsUrl,
  facebookUrl: optionalHttpsUrl,
  openingHours: openingHoursSchema,
});

export type OpeningHoursByDay = z.infer<typeof openingHoursSchema>;
export type SiteSettingsData = z.output<typeof siteSettingsSchema>;

const WEEKDAY = { opens: "09:00", closes: "20:00" };

/** Used until the first save from the admin (and by the seed). */
export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  phone: "+598 99 123 456",
  whatsapp: null,
  email: "dsstudio@gmail.com",
  street: "Av. 18 de Julio 1234",
  city: "Montevideo",
  latitude: -34.906,
  longitude: -56.178,
  instagramUrl: null,
  facebookUrl: null,
  openingHours: {
    MONDAY: WEEKDAY,
    TUESDAY: WEEKDAY,
    WEDNESDAY: WEEKDAY,
    THURSDAY: WEEKDAY,
    FRIDAY: WEEKDAY,
    SATURDAY: WEEKDAY,
    SUNDAY: { opens: "10:00", closes: "15:00" },
  },
};
