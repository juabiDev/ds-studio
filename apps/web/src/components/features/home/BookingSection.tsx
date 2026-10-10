import { BookingWizard } from "@/components/features/booking/BookingWizard";
import { SectionHeading } from "@/components/features/home/SectionHeading";

import type { BarberOption, ServiceOption } from "@/types/booking";

interface BookingSectionProps {
  services: ServiceOption[];
  barbers: BarberOption[];
  whatsappUrl: string;
}

export const BookingSection = ({ services, barbers, whatsappUrl }: BookingSectionProps) => {
  if (!services.length || !barbers.length) return null;

  return (
    <section id="agendar" className="py-20 md:py-24 bg-background scroll-mt-16">
      <div className="max-w-4xl mx-auto px-6">
        <SectionHeading eyebrow="En menos de 1 minuto" title="Reserva tu turno" />
        <BookingWizard
          services={services}
          barbers={barbers}
          whatsappUrl={whatsappUrl}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        />
      </div>
    </section>
  );
}