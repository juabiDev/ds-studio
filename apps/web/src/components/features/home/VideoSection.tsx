import Image from "next/image";

import { Instagram } from "lucide-react";

import type { BusinessInfo } from "@/types/site";

// The old play button showed no video, so it's gone until there's a real clip to embed.
export const VideoSection = ({ instagram }: { instagram: BusinessInfo["instagram"] }) => (
  <section className="relative overflow-hidden bg-black">
    <div className="relative bg-zinc-900 aspect-[4/5] sm:aspect-video max-h-[82vh] w-full">
      <Image
        src="https://images.unsplash.com/photo-1781455793310-8427c96454c7?w=1920&h=1080&fit=crop&auto=format"
        alt="Interior de DS STUDIO"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/65" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-6 text-center">
        <p className="font-condensed text-white/70 tracking-[0.45em] uppercase text-xs">La experiencia DS STUDIO</p>
        <h2 className="font-display font-bold text-white max-w-xl text-[clamp(2rem,5vw,4rem)] leading-[1.05]">
          Más que un corte.
          <br />
          Una experiencia.
        </h2>
        {instagram && (
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-12 border border-white/50 px-6 font-condensed text-white tracking-[0.25em] uppercase text-xs hover:bg-white hover:text-black transition-all"
          >
            <Instagram size={15} /> {instagram.handle}
          </a>
        )}
      </div>
    </div>
  </section>
);
