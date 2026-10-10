import "server-only";

import { prisma } from "@ds-studio/database";
import { SITE_SETTINGS_ID } from "@ds-studio/database/settings-store";

import type { FaqEntry } from "@/types/site";

/** Questions for the public FAQ; empty when the admin switched the section off. */
export const getFaqEntries = async (): Promise<FaqEntry[]> => {
  const [settings, items] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID }, select: { showFaq: true } }),
    prisma.faqItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, question: true, answer: true },
    }),
  ]);

  // No settings row yet means the defaults, where the FAQ is on
  return settings && !settings.showFaq ? [] : items;
};
