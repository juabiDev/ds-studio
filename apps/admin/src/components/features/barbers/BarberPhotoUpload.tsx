"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { setBarberPhoto } from "@/app/actions/barbers";

import { ACCEPTED_IMAGE_TYPES, useImageUpload } from "@/hooks/use-image-upload";
import { hintClass } from "@/lib/form-styles";

interface BarberPhotoUploadProps {
  employeeId: string;
  name: string;
  photoUrl: string | null;
  enabled: boolean;
}

// Picking a file uploads it right away; the page re-renders with the new photo via revalidatePath.
export const BarberPhotoUpload = ({ employeeId, name, photoUrl, enabled }: BarberPhotoUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { upload, uploading } = useImageUpload("barber");

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    const uploaded = await upload(file);
    if (inputRef.current) inputRef.current.value = "";
    if (!uploaded.ok) return setError(uploaded.error);

    setSaving(true);
    // A dropped connection rejects the action; the button must not stay stuck on "Guardando…"
    const result = await setBarberPhoto({ employeeId, imageId: uploaded.imageId })
      .catch(() => ({ ok: false as const, error: "Se cortó la conexión. Intenta subir la foto de nuevo." }))
      .finally(() => setSaving(false));
    if (!result.ok) setError(result.error);
  };

  const busy = uploading || saving;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h2 className="font-medium">Foto de perfil</h2>
      <div className="flex items-center gap-4">
        <div className="aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-md bg-secondary">
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- small admin preview
            <img src={photoUrl} alt={`Foto de ${name}`} className="h-full w-full object-cover" />
          )}
        </div>
        {enabled ? (
          <div>
            <label
              htmlFor="barber-photo"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-4 text-sm hover:bg-secondary has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50"
            >
              {uploading ? "Subiendo…" : saving ? "Guardando…" : photoUrl ? "Cambiar foto" : "Subir foto"}
              <input
                ref={inputRef}
                id="barber-photo"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={handleChange}
                disabled={busy}
                className="sr-only"
              />
            </label>
            <p className={hintClass}>Vertical (3:4), JPG, PNG o WebP de hasta 10 MB.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Para subir fotos falta configurar Cloudflare Images (CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_IMAGES_API_TOKEN).
          </p>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </div>
  );
};
