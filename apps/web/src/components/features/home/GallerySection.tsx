import { GalleryGrid } from "@/components/features/home/GalleryGrid";
import { SectionHeading } from "@/components/features/home/SectionHeading";

import type { GalleryPhoto } from "@/types/site";

export const GallerySection = ({ photos }: { photos: GalleryPhoto[] }) => {
  // Filters follow the order of each category's first photo
  const categories = [...new Set(photos.map((p) => p.category))];

  if (!photos.length) return null;

  return (
    <section id="galeria" className="py-20 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading eyebrow="Nuestro trabajo" title="Galería" className="mb-8 md:mb-12" />
        <GalleryGrid photos={photos} categories={categories} />
      </div>
    </section>
  );
};
