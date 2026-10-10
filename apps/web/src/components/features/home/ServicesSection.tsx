import { Clock, Scissors } from "lucide-react";

import { BookServiceButton } from "@/components/features/home/BookServiceButton";
import { SectionHeading } from "@/components/features/home/SectionHeading";

import type { ServiceOption } from "@/types/booking";

// Server-rendered card; only the "Reservar" button is a client island
const ServiceCard = ({ service, index }: { service: ServiceOption; index: number }) => (
  <div className="border border-white/10 bg-card p-6 md:p-8 hover:border-white/25 transition-all duration-300 group">
    <div className="flex items-start justify-between mb-5">
      <Scissors size={18} className="text-white/40 group-hover:text-white/60 transition-colors mt-0.5" />
      <span className="font-display font-bold text-white/12 group-hover:text-white/25 text-3xl transition-colors leading-none">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
    <h3 className="font-display font-bold text-foreground text-xl mb-2">{service.name}</h3>
    <div className="flex items-center gap-1.5 text-white/65 text-sm font-condensed tracking-wider mb-6">
      <Clock size={12} />
      <span>{service.durationMinutes} min</span>
    </div>
    <div className="flex items-center justify-between border-t border-white/10 pt-5">
      <span className="font-display font-bold text-white text-2xl">{service.price ?? "Consultar"}</span>
      <BookServiceButton serviceId={service.id} />
    </div>
  </div>
);

export const ServicesSection = ({ services }: { services: ServiceOption[] }) => {
  if (!services.length) return null;
  
  return (
    <section id="servicios" className="py-20 md:py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading eyebrow="Lo que hacemos" title="Servicios & Precios" />
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
};
