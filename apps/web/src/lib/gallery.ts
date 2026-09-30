import "server-only";

import { prisma } from "@ds-studio/database";

import type { GalleryPhoto } from "@/types/site";

// Photos are added by hand (Cloudflare R2 + database); there's no admin screen for them.
export const getGalleryPhotos = async (): Promise<GalleryPhoto[]> => {
  const rows = await prisma.galleryImage.findMany({
    where: { deletedAt: null, thumbnail: { deletedAt: null } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, category: true, thumbnail: { select: { imageUrl: true, alt: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    src: r.thumbnail.imageUrl,
    alt: r.thumbnail.alt ?? `${r.category} — DS STUDIO`,
    category: r.category,
  }));
};
