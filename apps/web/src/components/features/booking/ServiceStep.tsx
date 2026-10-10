import { ChevronRight } from "lucide-react";

import { optionClass, sectionLabel } from "@/components/features/booking/wizard-styles";

import type { ServiceOption } from "@/types/booking";

interface ServiceStepProps {
  services: ServiceOption[];
  selectedId: string | null;
  onSelect: (serviceId: string) => void;
}

export const ServiceStep = ({ services, selectedId, onSelect }: ServiceStepProps) => (
  <div>
    <p className={sectionLabel}>Elige un servicio</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {services.map((s) => (
        <button key={s.id} onClick={() => onSelect(s.id)} className={`text-left p-5 ${optionClass(selectedId === s.id)}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display font-bold text-white text-base">{s.name}</p>
              <p className="font-condensed text-white/65 text-sm tracking-wider mt-1">{s.durationMinutes} min</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              {s.price && <span className="font-display text-white font-bold text-base">{s.price}</span>}
              <ChevronRight size={16} className="text-white/50" />
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
);
