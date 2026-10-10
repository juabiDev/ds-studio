"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@ds-studio/auth";
import { prisma } from "@ds-studio/database";

import { getUploadedImage } from "@/lib/cloudflare-images";
import { moveInList } from "@/lib/reorder";
import { firstIssue, galleryImageSchema, idSchema, moveSchema, newGalleryImageSchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/types/admin";

const orderedGalleryIds = async () => {
  const rows = await prisma.galleryImage.findMany({
    // Same filter as the admin list, so up/down swaps with the photo the admin actually sees
    where: { deletedAt: null, thumbnail: { deletedAt: null } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  return rows.map((r) => r.id);
};

/** Step 2 of an upload: verifies the photo on Cloudflare and adds it to the end of the gallery. */
export const addGalleryImage = async (input: { imageId: string; category: string; alt: string }): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = newGalleryImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  try {
    const image = await getUploadedImage(parsed.data.imageId, "gallery");
    if (!image) return { ok: false, error: "No encontramos la foto subida. Intenta subirla de nuevo." };

    const last = await prisma.galleryImage.aggregate({ where: { deletedAt: null }, _max: { sortOrder: true } });
    await prisma.galleryImage.create({
      data: {
        category: parsed.data.category,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        thumbnail: { create: { ...image, alt: parsed.data.alt } },
      },
    });
  } catch (error) {
    console.error("[addGalleryImage]", error);
    return { ok: false, error: "No se pudo guardar la foto." };
  }

  revalidatePath("/galeria");
  return { ok: true };
};

export const updateGalleryImage = async (input: { id: string; category: string; alt: string }): Promise<ActionResult> => {
  await requireAdmin();

  const parsedId = idSchema.safeParse(input);
  const parsed = galleryImageSchema.safeParse(input);
  if (!parsedId.success) return { ok: false, error: "Datos inválidos." };
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  try {
    const row = await prisma.galleryImage.findFirst({
      where: { id: parsedId.data.id, deletedAt: null },
      select: { thumbnailId: true },
    });
    if (!row) return { ok: false, error: "Esa foto ya no existe." };

    await prisma.$transaction([
      prisma.galleryImage.update({ where: { id: parsedId.data.id }, data: { category: parsed.data.category } }),
      prisma.thumbnail.update({ where: { id: row.thumbnailId }, data: { alt: parsed.data.alt } }),
    ]);
  } catch (error) {
    console.error("[updateGalleryImage]", error);
    return { ok: false, error: "No se pudo guardar la foto." };
  }

  revalidatePath("/galeria");
  return { ok: true };
};

export const moveGalleryImage = async (input: { id: string; direction: "up" | "down" }): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    const order = moveInList(await orderedGalleryIds(), parsed.data.id, parsed.data.direction);
    if (!order) return { ok: true };

    await prisma.$transaction(order.map((id, sortOrder) => prisma.galleryImage.update({ where: { id }, data: { sortOrder } })));
  } catch (error) {
    console.error("[moveGalleryImage]", error);
    return { ok: false, error: "No se pudo mover la foto." };
  }

  revalidatePath("/galeria");
  return { ok: true };
};

/** Soft delete: the photo leaves the site; the file stays on Cloudflare. */
export const deleteGalleryImage = async (input: { id: string }): Promise<ActionResult> => {
  await requireAdmin();

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    await prisma.galleryImage.updateMany({ where: { id: parsed.data.id, deletedAt: null }, data: { deletedAt: new Date() } });
  } catch (error) {
    console.error("[deleteGalleryImage]", error);
    return { ok: false, error: "No se pudo eliminar la foto." };
  }

  revalidatePath("/galeria");
  return { ok: true };
};
