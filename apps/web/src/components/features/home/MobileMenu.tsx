"use client";

import { useState } from "react";

import { Menu, X } from "lucide-react";

import type { NavLink } from "@/lib/home-content";

export const MobileMenu = ({ links }: { links: NavLink[] }) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden -mr-2.5 flex items-center justify-center w-11 h-11 text-white"
        aria-label="Menú"
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Positioned against the fixed <nav> so it drops below the header row */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/97 backdrop-blur-xl border-t border-white/8 px-6 py-6 flex flex-col gap-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={close}
              className="font-condensed text-white/80 hover:text-white tracking-[0.3em] uppercase text-sm py-3.5 border-b border-white/5 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#agendar"
            onClick={close}
            className="mt-4 border border-white/70 text-white font-condensed tracking-[0.25em] uppercase text-xs px-6 py-4 text-center hover:bg-white hover:text-black transition-all"
          >
            Agendar turno
          </a>
        </div>
      )}
    </>
  );
};
