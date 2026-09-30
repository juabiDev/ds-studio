"use client";

import { useEffect, useState, type ReactNode } from "react";

// Only the scroll-dependent background needs the browser; the nav content is server-rendered children.
export const NavScrollContainer = ({ children }: { children: ReactNode }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/92 backdrop-blur-md border-b border-white/8"
          : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      {children}
    </nav>
  );
};
