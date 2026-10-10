"use client";

import { useState } from "react";

import { requestImageUpload } from "@/app/actions/media";

// Cloudflare Images rejects files over 10 MB. HEIC is accepted there too, but iPhones already
// convert to JPEG when the file input doesn't list HEIC.
const MAX_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

type UploadResult = { ok: true; imageId: string } | { ok: false; error: string };

/**
 * Uploads one photo straight from the browser to Cloudflare Images. Returns the image id, which
 * the caller then saves with a server action (that verifies it on Cloudflare).
 */
export const useImageUpload = (purpose: "gallery" | "barber") => {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File): Promise<UploadResult> => {
    if (!ACCEPTED_IMAGE_TYPES.split(",").includes(file.type)) {
      return { ok: false, error: "Elige una foto JPG, PNG o WebP." };
    }
    if (file.size > MAX_BYTES) return { ok: false, error: "La foto pesa más de 10 MB." };

    setUploading(true);
    try {
      const target = await requestImageUpload({ purpose });
      if (!target.ok) return target;

      const body = new FormData();
      body.append("file", file);
      const res = await fetch(target.uploadURL, { method: "POST", body });
      const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (!res.ok || !json?.success) return { ok: false, error: "Cloudflare rechazó la foto. Prueba con otra." };

      return { ok: true, imageId: target.imageId };
    } catch (error) {
      console.error("[useImageUpload]", error);
      return { ok: false, error: "Se cortó la subida. Revisa la conexión y prueba de nuevo." };
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
};
