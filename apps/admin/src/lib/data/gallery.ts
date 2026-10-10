import "server-only";

import { prisma } from "@ds-studio/database";

export interface AdminGalleryPhoto {
  id: string;
  src: string;
  alt: string;
  category: string;
}

/**
 * Seeded photos are paths served by the public site (/images/...); this app has no copy of
 * them, so they're shown from the site's own origin.
 */
export const resolveMediaUrl = (src: string) =>
  src.startsWith("/") ? new URL(src, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").toString() : src;

export const getGalleryForAdmin = async () => {
  const rows = await prisma.galleryImage.findMany({
    where: { deletedAt: null, thumbnail: { deletedAt: null } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, category: true, thumbnail: { select: { imageUrl: true, alt: true } } },
  });

  const photos: AdminGalleryPhoto[] = rows.map((r) => ({
    id: r.id,
    src: resolveMediaUrl(r.thumbnail.imageUrl),
    alt: r.thumbnail.alt ?? "",
    category: r.category,
  }));

  // Suggested in the upload form so the site's filter buttons don't fragment ("Corte" vs "Cortes")
  const categories = [...new Set(photos.map((p) => p.category))];

  return { photos, categories };
};
