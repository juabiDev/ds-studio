"use client";

import { useEffect, useState } from "react";

import { Phone } from "lucide-react";

import { WhatsAppIcon } from "@/components/features/home/WhatsAppIcon";

interface MobileActionBarProps {
  phoneHref: string;
  whatsappUrl: string;
}

// Thumb-zone actions on mobile. Hidden while the booking section is on screen,
// where the wizard's own sticky buttons take over.
export const MobileActionBar = ({ phoneHref, whatsappUrl }: MobileActionBarProps) => {
  const [bookingVisible, setBookingVisible] = useState(false);

  useEffect(() => {
    const booking = document.getElementById("agendar");
    if (!booking) return;

    const observer = new IntersectionObserver(([entry]) => setBookingVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(booking);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 ${
        bookingVisible ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex gap-2">
        <a
          href="#agendar"
          className="flex-1 inline-flex items-center justify-center min-h-12 bg-white text-black font-condensed tracking-[0.25em] uppercase text-sm"
        >
          Reservar turno
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="inline-flex items-center justify-center w-12 min-h-12 bg-[#25D366] text-white"
        >
          <WhatsAppIcon size={22} />
        </a>
        <a
          href={phoneHref}
          aria-label="Llamar"
          className="inline-flex items-center justify-center w-12 min-h-12 border border-white/30 text-white"
        >
          <Phone size={18} />
        </a>
      </div>
    </div>
  );
};
