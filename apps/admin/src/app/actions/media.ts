"use server";

import { requireAdmin } from "@ds-studio/auth";

import { createDirectUpload } from "@/lib/cloudflare-images";
import { imageUploadRequestSchema } from "@/lib/validation/admin";

export type ImageUploadUrlResult = { ok: true; uploadURL: string; imageId: string } | { ok: false; error: string };

/** Step 1 of a photo upload: a one-time Cloudflare URL the browser posts the file to. */
export const requestImageUpload = async (input: { purpose: "gallery" | "barber" }): Promise<ImageUploadUrlResult> => {
  await requireAdmin();

  const parsed = imageUploadRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    const upload = await createDirectUpload(parsed.data.purpose);
    if (!upload) return { ok: false, error: "La subida de fotos no está disponible. Revisa la configuración de Cloudflare." };
    return { ok: true, uploadURL: upload.uploadURL, imageId: upload.id };
  } catch (error) {
    console.error("[requestImageUpload]", error);
    return { ok: false, error: "No se pudo preparar la subida. Prueba de nuevo." };
  }
};
