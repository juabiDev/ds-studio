import "server-only";

import { prisma } from "./index";
import { DEFAULT_SITE_SETTINGS, openingHoursSchema, type SiteSettingsData } from "./settings";

export const SITE_SETTINGS_ID = 1;

export const getSiteSettings = async (): Promise<SiteSettingsData> => {
  const row = await prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } });
  if (!row) return DEFAULT_SITE_SETTINGS;

  // The JSON column can be edited by hand in the database; never let a typo break the site
  const hours = openingHoursSchema.safeParse(row.openingHours);

  return {
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    street: row.street,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    instagramUrl: row.instagramUrl,
    facebookUrl: row.facebookUrl,
    openingHours: hours.success ? hours.data : DEFAULT_SITE_SETTINGS.openingHours,
  };
};

export const saveSiteSettings = (data: SiteSettingsData) =>
  prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...data },
    update: data,
  });
