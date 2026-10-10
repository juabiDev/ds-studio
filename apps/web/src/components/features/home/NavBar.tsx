import { MobileMenu } from "@/components/features/home/MobileMenu";
import { NavScrollContainer } from "@/components/features/home/NavScrollContainer";

import { NAV_LINKS } from "@/lib/home-content";

export const NavBar = () => (
  <NavScrollContainer>
    <div className="max-w-7xl mx-auto px-6 py-3 md:py-5 flex items-center justify-between">
      {/* Logo */}
      <a href="#inicio" className="flex items-center gap-3 group">
        <div className="w-8 h-8 border border-white/50 flex items-center justify-center group-hover:border-white transition-colors">
          <span className="font-condensed font-bold tracking-widest text-white text-xs">DS</span>
        </div>
        <span className="font-display text-white text-lg tracking-[0.22em] uppercase font-bold">DS STUDIO</span>
      </a>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="font-condensed text-white/75 hover:text-white text-xs tracking-[0.3em] uppercase transition-colors duration-200"
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* CTA + hamburger */}
      <div className="flex items-center gap-4">
        <a
          href="#agendar"
          className="hidden md:inline-flex items-center gap-2 border border-white/70 text-white font-condensed tracking-[0.25em] uppercase text-xs px-6 py-2.5 hover:bg-white hover:text-black transition-all duration-200"
        >
          Reservar
        </a>
        <MobileMenu links={NAV_LINKS} />
      </div>
    </div>
  </NavScrollContainer>
);
