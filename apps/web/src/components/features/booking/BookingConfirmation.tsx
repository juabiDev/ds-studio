import { Check } from "lucide-react";

import { primaryButton, secondaryButton } from "@/components/features/booking/wizard-styles";

import { formatDateKey } from "@/lib/format";
import type { ConfirmedBooking } from "@/types/booking";

interface BookingConfirmationProps {
  booking: ConfirmedBooking;
  whatsappUrl: string;
  onReset: () => void;
}

export const BookingConfirmation = ({ booking, whatsappUrl, onReset }: BookingConfirmationProps) => (
  <div className="text-center py-16 px-6 border border-white/15">
    <div className="w-16 h-16 border-2 border-white/60 rounded-full flex items-center justify-center mx-auto mb-7">
      <Check size={26} className="text-white" />
    </div>
    <h3 className="font-display text-3xl font-bold text-white mb-3">¡Turno reservado!</h3>
    <p className="font-condensed text-white/70 tracking-wider text-sm uppercase mb-1">
      {booking.serviceName} con {booking.barberName}
    </p>
    <p className="font-display text-xl text-white mt-2">
      {formatDateKey(booking.date)} a las {booking.time} hs
    </p>
    <p className="font-body text-white/65 text-sm mt-5 max-w-xs mx-auto">
      ¿Necesitás cambiarlo o cancelarlo? Escribinos por WhatsApp.
    </p>
    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={primaryButton}>
        Escribir por WhatsApp
      </a>
      <button onClick={onReset} className={secondaryButton}>
        Nueva reserva
      </button>
    </div>
  </div>
);
