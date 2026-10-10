"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { addGalleryImage } from "@/app/actions/gallery";

import { ACCEPTED_IMAGE_TYPES, useImageUpload } from "@/hooks/use-image-upload";
import { fieldClass, hintClass, labelClass, submitClass } from "@/lib/form-styles";
import { firstIssue, galleryImageSchema } from "@/lib/validation/admin";

interface GalleryUploadFormProps {
  categories: string[];
  /** False when the Cloudflare credentials aren't set; the form explains instead of failing */
  enabled: boolean;
}

export const GalleryUploadForm = ({ categories, enabled }: GalleryUploadFormProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState(categories[0] ?? "Cortes");
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cloudflare id of the current file once uploaded, so a failed save retries without re-uploading
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const { upload, uploading } = useImageUpload("gallery");

  // Local preview; the object URL is released when the file changes or the form unmounts
  useEffect(() => {
    setUploadedId(null);
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!enabled) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Para subir fotos falta configurar Cloudflare Images (CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_IMAGES_API_TOKEN).
      </p>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return setError("Elige una foto.");
    // Same rules as the server, checked first so a typo never leaves an orphan file on Cloudflare
    const fields = galleryImageSchema.safeParse({ category, alt });
    if (!fields.success) return setError(firstIssue(fields.error));
    setError(null);

    let imageId = uploadedId;
    if (!imageId) {
      const uploaded = await upload(file);
      if (!uploaded.ok) return setError(uploaded.error);
      imageId = uploaded.imageId;
      setUploadedId(imageId);
    }

    setSaving(true);
    // A dropped connection rejects the action; the button must not stay stuck on "Guardando…"
    const result = await addGalleryImage({ imageId, ...fields.data })
      .catch(() => ({ ok: false as const, error: "Se cortó la conexión. Prueba de nuevo; la foto ya está subida." }))
      .finally(() => setSaving(false));
    if (!result.ok) return setError(result.error);

    setFile(null);
    setAlt("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const busy = uploading || saving;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h2 className="font-medium">Subir foto</h2>

      <div>
        <label htmlFor="gallery-file" className={labelClass}>Foto</label>
        <input
          ref={fileRef}
          id="gallery-file"
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
          className="block w-full text-base file:mr-3 file:h-11 file:rounded-md file:border-0 file:bg-secondary file:px-4 file:text-foreground"
        />
        <p className={hintClass}>JPG, PNG o WebP de hasta 10 MB. Las fotos verticales quedan mejor.</p>
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
        <img src={preview} alt="" className="aspect-[3/4] w-40 rounded-md object-cover" />
      )}

      <div>
        <label htmlFor="gallery-category" className={labelClass}>Categoría</label>
        <input
          id="gallery-category"
          list="gallery-categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          maxLength={30}
          className={fieldClass}
        />
        <datalist id="gallery-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <p className={hintClass}>Es el filtro del sitio. Usa una existente para no crear filtros repetidos.</p>
      </div>

      <div>
        <label htmlFor="gallery-alt" className={labelClass}>Descripción</label>
        <input
          id="gallery-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          required
          maxLength={140}
          placeholder="Fade bajo con barba perfilada"
          className={fieldClass}
        />
        <p className={hintClass}>Describe el corte: la leen Google y los lectores de pantalla.</p>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={busy} className={submitClass}>
        {uploading ? "Subiendo…" : saving ? "Guardando…" : "Subir foto"}
      </button>
    </form>
  );
};
