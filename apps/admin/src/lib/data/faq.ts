import "server-only";

import { prisma } from "@ds-studio/database";
import { SITE_SETTINGS_ID } from "@ds-studio/database/settings-store";

export interface AdminFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const getFaqForAdmin = async () => {
  const [items, settings] = await Promise.all([
    prisma.faqItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, question: true, answer: true },
    }),
    prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID }, select: { showFaq: true } }),
  ]);

  // No settings row yet = defaults, where the FAQ is visible
  return { items: items satisfies AdminFaqItem[], visible: settings?.showFaq ?? true };
};
