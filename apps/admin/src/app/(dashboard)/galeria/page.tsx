import type { Metadata } from "next";

import { GalleryItemCard } from "@/components/features/gallery/GalleryItemCard";
import { GalleryUploadForm } from "@/components/features/gallery/GalleryUploadForm";
import { EmptyState } from "@/components/ui/EmptyState";

import { isImageUploadConfigured } from "@/lib/cloudflare-images";
import { getGalleryForAdmin } from "@/lib/data/gallery";

export const metadata: Metadata = { title: "Galería" };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const { photos, categories } = await getGalleryForAdmin();

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Galería</h1>
        <p className="text-sm text-muted-foreground">
          Fotos del sitio, en el orden en que se muestran. Los cambios se ven en hasta 5 minutos.
        </p>
      </div>

      <GalleryUploadForm categories={categories} enabled={isImageUploadConfigured()} />

      {photos.length === 0 ? (
        <EmptyState className="p-6 text-center text-sm">
          No hay fotos. Sin fotos, la galería no aparece en el sitio.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {photos.map((photo, i) => (
            <GalleryItemCard key={photo.id} photo={photo} categories={categories} isFirst={i === 0} isLast={i === photos.length - 1} />
          ))}
        </ul>
      )}
    </section>
  );
}
