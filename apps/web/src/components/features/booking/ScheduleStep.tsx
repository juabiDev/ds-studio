import Image from "next/image";

import { ChevronRight, Users } from "lucide-react";

import { dateKeyToDbDate } from "@ds-studio/database/dates";

import { StepActions } from "@/components/features/booking/StepActions";
import { optionClass, primaryButton, secondaryButton, sectionLabel } from "@/components/features/booking/wizard-styles";

import { ANY_BARBER } from "@/lib/availability";
import { DAY_NAMES, MONTH_NAMES } from "@/lib/home-content";
import type { BarberOption } from "@/types/booking";

interface BarberPickerProps {
  barbers: BarberOption[];
  selected: string;
  onSelect: (barberChoice: string) => void;
}

const BarberPicker = ({ barbers, selected, onSelect }: BarberPickerProps) => (
  <div className="flex gap-3 mb-10 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5">
    <button
      onClick={() => onSelect(ANY_BARBER)}
      className={`flex-shrink-0 w-24 sm:w-auto p-3 text-center ${optionClass(selected === ANY_BARBER)}`}
    >
      <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-zinc-800 flex items-center justify-center">
        <Users size={18} className="text-white/70" />
      </div>
      <p className="font-condensed text-white text-sm tracking-wider">Cualquiera</p>
    </button>
    {barbers.map((b) => (
      <button
        key={b.id}
        onClick={() => onSelect(b.id)}
        className={`flex-shrink-0 w-24 sm:w-auto p-3 text-center ${optionClass(selected === b.id)}`}
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 bg-zinc-800">
          {b.avatarUrl && <Image src={b.avatarUrl} alt={b.name} fill sizes="48px" className="object-cover" />}
        </div>
        <p className="font-condensed text-white text-sm tracking-wider">{b.name.split(" ")[0]}</p>
      </button>
    ))}
  </div>
);

interface DatePickerProps {
  dateKeys: string[];
  selected: string | null;
  onSelect: (dateKey: string) => void;
}

const DatePicker = ({ dateKeys, selected, onSelect }: DatePickerProps) => (
  <div className="flex gap-2 mb-10 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0">
    {dateKeys.map((key, i) => {
      const d = dateKeyToDbDate(key);
      return (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`flex-shrink-0 flex flex-col items-center px-4 py-3 min-w-[68px] ${optionClass(selected === key)}`}
        >
          <span className="font-condensed text-white/65 text-xs tracking-wider uppercase">
            {i === 0 ? "Hoy" : i === 1 ? "Mañana" : DAY_NAMES[d.getUTCDay()]}
          </span>
          <span className="font-display text-white text-xl font-bold my-0.5">{d.getUTCDate()}</span>
          <span className="font-condensed text-white/65 text-xs tracking-wider uppercase">
            {MONTH_NAMES[d.getUTCMonth()]}
          </span>
        </button>
      );
    })}
  </div>
);

interface TimePickerProps {
  /** null while loading */
  times: string[] | null;
  timesError: boolean;
  selected: string | null;
  anyBarber: boolean;
  onSelect: (time: string) => void;
}

const TimePicker = ({ times, timesError, selected, anyBarber, onSelect }: TimePickerProps) => {
  if (timesError) {
    return <p className="font-body text-white/70 text-sm">No pudimos cargar los horarios. Prueba de nuevo en un momento.</p>;
  }

  if (times === null) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2" aria-busy="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-11 bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (times.length === 0) {
    return (
      <p className="font-body text-white/70 text-sm">
        No quedan horarios para este día{!anyBarber ? " con este barbero" : ""}. Prueba otra fecha.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
      {times.map((t) => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          className={`min-h-11 font-condensed text-sm tracking-wider ${optionClass(selected === t)} ${
            selected === t ? "text-white" : "text-white/80"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};

interface ScheduleStepProps {
  barbers: BarberOption[];
  barberChoice: string;
  onBarberChange: (barberChoice: string) => void;
  dateKeys: string[];
  dateKey: string | null;
  onDateChange: (dateKey: string) => void;
  times: string[] | null;
  timesError: boolean;
  time: string | null;
  onTimeChange: (time: string) => void;
  slotNotice: string | null;
  checking: boolean;
  onBack: () => void;
  onContinue: () => void;
}

export const ScheduleStep = ({
  barbers,
  barberChoice,
  onBarberChange,
  dateKeys,
  dateKey,
  onDateChange,
  times,
  timesError,
  time,
  onTimeChange,
  slotNotice,
  checking,
  onBack,
  onContinue,
}: ScheduleStepProps) => (
  <div>
    <p className={sectionLabel}>Elige tu barbero</p>
    <BarberPicker barbers={barbers} selected={barberChoice} onSelect={onBarberChange} />

    <p className={sectionLabel}>Elige la fecha</p>
    <DatePicker dateKeys={dateKeys} selected={dateKey} onSelect={onDateChange} />

    <p className={sectionLabel}>Elige el horario</p>
    {slotNotice && (
      <p role="alert" className="mb-4 border border-amber-400/40 bg-amber-400/10 px-4 py-3 font-body text-sm text-amber-200">
        {slotNotice}
      </p>
    )}
    <TimePicker
      times={times}
      timesError={timesError}
      selected={time}
      anyBarber={barberChoice === ANY_BARBER}
      onSelect={onTimeChange}
    />

    <StepActions>
      <button onClick={onBack} className={secondaryButton}>
        Atrás
      </button>
      <button disabled={!time || checking} onClick={onContinue} className={primaryButton}>
        {checking ? "Verificando…" : "Continuar"} {!checking && <ChevronRight size={13} />}
      </button>
    </StepActions>
  </div>
);
