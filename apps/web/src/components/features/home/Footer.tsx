import Link from "next/link";

import { Facebook, Instagram } from "lucide-react";

import { NAV_LINKS } from "@/lib/home-content";

const socialLink = "flex items-center justify-center w-11 h-11 text-white/60 hover:text-white transition-colors";

interface FooterProps {
  instagramUrl: string | null;
  facebookUrl: string | null;
}

export const Footer = ({ instagramUrl, facebookUrl }: FooterProps) => (
  <footer className="bg-black border-t border-white/10 py-10">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border border-white/40 flex items-center justify-center">
            <span className="font-condensed font-bold tracking-widest text-white text-xs">DS</span>
          </div>
          <span className="font-display text-white text-base tracking-[0.22em] uppercase font-bold">DS STUDIO</span>
        </div>

        <nav className="flex flex-wrap gap-x-5 justify-center">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="inline-flex items-center min-h-11 font-condensed text-white/60 hover:text-white transition-colors text-xs tracking-[0.25em] uppercase"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {(instagramUrl || facebookUrl) && (
          <div className="flex items-center gap-1">
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={socialLink}>
                <Instagram size={18} />
              </a>
            )}
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={socialLink}>
                <Facebook size={18} />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 mt-8 pt-6 text-center">
        <p className="font-condensed text-white/50 text-xs tracking-[0.2em]">
          © {new Date().getFullYear()} DS STUDIO — Barbería Montevideo. Todos los derechos reservados.
        </p>
        <Link
          href="/privacidad"
          className="inline-flex items-center min-h-11 font-condensed text-white/50 hover:text-white text-xs tracking-[0.2em] transition-colors"
        >
          Política de privacidad
        </Link>
        <span className="text-white/30" aria-hidden="true">·</span>
        <Link
          href="/terminos"
          className="inline-flex items-center min-h-11 font-condensed text-white/50 hover:text-white text-xs tracking-[0.2em] transition-colors"
        >
          Términos y condiciones
        </Link>
      </div>
    </div>
  </footer>
);
