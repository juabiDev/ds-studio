import Image from "next/image";

import { SectionHeading } from "@/components/features/home/SectionHeading";

import type { BarberOption } from "@/types/booking";

export const TeamSection = ({ barbers }: { barbers: BarberOption[] }) => (
  <section id="equipo" className="py-20 md:py-24 bg-zinc-950">
    <div className="max-w-7xl mx-auto px-6">
      <SectionHeading eyebrow="Conocé al equipo" title="Nuestros barberos" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {barbers.map((member) => (
          <div key={member.id} className="group">
            <div className="relative overflow-hidden bg-zinc-800 mb-4 aspect-[3/4]">
              {member.photoUrl && (
                <Image
                  src={member.photoUrl}
                  alt={member.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  // Color on mobile (no hover); grayscale-until-hover only where hover exists
                  className="object-cover transition-all duration-700 md:grayscale md:group-hover:grayscale-0 md:group-hover:scale-[1.04]"
                />
              )}
            </div>
            <h3 className="font-display font-bold text-foreground text-base">{member.name}</h3>
            <p className="font-condensed text-white/65 text-xs tracking-[0.2em] uppercase mt-1">{member.role}</p>
            {member.specialty && <p className="font-condensed text-white/80 text-sm mt-1">{member.specialty}</p>}
            {member.experience && (
              <p className="font-condensed text-white/60 text-sm mt-0.5">{member.experience} de experiencia</p>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);
