"use client";

import { SELECT_SERVICE_EVENT } from "@/lib/booking-events";

// Keeps the #agendar href so it still scrolls without JS; with JS it also pre-selects the service.
export const BookServiceButton = ({ serviceId }: { serviceId: string }) => (
  <a
    href="#agendar"
    onClick={() => window.dispatchEvent(new CustomEvent(SELECT_SERVICE_EVENT, { detail: { serviceId } }))}
    className="inline-flex items-center min-h-11 -my-2 font-condensed text-xs tracking-[0.3em] uppercase text-white/60 group-hover:text-white/80 hover:text-white transition-colors"
  >
    Reservar →
  </a>
);
