"use client";

import Image from "next/image";
import { useState } from "react";

import type { GalleryPhoto } from "@/types/site";

interface GalleryGridProps {
  photos: GalleryPhoto[];
  categories: string[];
}

const filterClass = (active: boolean) =>
  `flex-shrink-0 min-h-11 font-condensed tracking-[0.25em] uppercase text-xs px-5 border transition-all duration-200 ${
    active ? "bg-white text-black border-white" : "border-white/25 text-white/70 hover:border-white/50 hover:text-white"
  }`;

// The only client part of the gallery: the filter state. Photos arrive server-rendered.
export const GalleryGrid = ({ photos, categories }: GalleryGridProps) => {
  // null = "Todos"
  const [filter, setFilter] = useState<string | null>(null);

  const visible = filter ? photos.filter((p) => p.category === filter) : photos;

  return (
    <>
      {categories.length > 1 && (
        // One scrollable row on mobile instead of wrapping into several
        <div className="flex gap-2 mb-8 overflow-x-auto -mx-6 px-6 pb-1 md:flex-wrap md:mx-0 md:px-0">
          <button onClick={() => setFilter(null)} aria-pressed={filter === null} className={filterClass(filter === null)}>
            Todos
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setFilter(c)} aria-pressed={filter === c} className={filterClass(filter === c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Photos are portrait, so every tile shares one 3:4 aspect */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {visible.map((photo) => (
          <div key={photo.id} className="relative overflow-hidden bg-zinc-900 group aspect-[3/4]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1280px) 420px, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 md:group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:from-black/0 md:group-hover:bg-black/45 transition-all duration-300" />
            {/* Always visible on mobile; revealed on hover on desktop */}
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300">
              <span className="font-condensed text-white text-xs tracking-[0.25em] uppercase border border-white/60 px-2.5 py-1">
                {photo.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
