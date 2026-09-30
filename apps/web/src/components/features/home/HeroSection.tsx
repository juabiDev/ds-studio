import Image from "next/image";

import { ChevronRight } from "lucide-react";

import type { OpeningHoursByDay } from "@ds-studio/database/settings";

import { OpenStatus } from "@/components/features/home/OpenStatus";

export const HeroSection = ({ hours }: { hours: OpeningHoursByDay }) => {
  return (
    // svh: stays stable while mobile browser toolbars show/hide
    <section id="inicio" className="relative min-h-svh flex items-end pb-16 md:pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900">
        <Image
          src="/images/hero.jpg"
          alt="Sala de espera de DS STUDIO Montevideo con el cartel de neón"
          fill
          priority
          sizes="100vw"
          // Portrait photo: bias the landscape crop toward the neon sign
          className="object-cover object-[65%_35%] opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      </div>

      <div className="absolute left-6 top-1/4 bottom-1/4 w-px bg-white/10 hidden lg:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-8 h-px bg-white/40" />
          <p className="font-condensed text-white/70 tracking-[0.35em] uppercase text-xs">Montevideo · Uruguay · Est. 2018</p>
        </div>
        <div className="mb-6 min-h-5">
          <OpenStatus hours={hours} />
        </div>

        <h1 className="font-display font-bold text-white leading-[0.92] mb-7 text-[clamp(3.2rem,10vw,9rem)]">
          El Arte del
          <br />
          <span className="text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.75)]">Corte Perfecto</span>
        </h1>

        <p className="font-body text-white/75 text-base md:text-lg mb-9 max-w-sm leading-relaxed">
          Barbería urbana de precisión. Donde el estilo clásico se encuentra con la cultura contemporánea.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <a
            href="#agendar"
            className="inline-flex items-center justify-center gap-3 min-h-12 bg-white text-black font-condensed tracking-[0.25em] uppercase text-sm px-9 hover:bg-white/90 transition-all group"
          >
            Agendar tu turno
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#servicios"
            className="inline-flex items-center justify-center gap-3 min-h-12 border border-white/40 text-white/85 font-condensed tracking-[0.25em] uppercase text-sm px-9 hover:border-white/70 hover:text-white transition-all"
          >
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
};
