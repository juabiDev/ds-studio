"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CalendarDays } from "lucide-react";

import { Calendar } from "@ds-studio/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@ds-studio/ui/popover";
import { cn } from "@ds-studio/ui/utils";
import type { DayOccupancy } from "@ds-studio/database/booking";

import { useMonthOccupancy } from "@/hooks/use-month-occupancy";
import { agendaHref } from "@/lib/agenda";
import { dateToKey, keyToDate } from "@/lib/calendar";

interface AgendaDatePickerProps {
  dateKey: string;
  label: string;
  /** Selected barber filter, so the colors match the agenda below */
  employeeId: string | null;
}

const WEEKDAY_NAMES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const captionFormatter = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });

const OCCUPANCY_CLASS: Record<DayOccupancy, string> = {
  free: "bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/40",
  partial: "bg-amber-400/25 text-amber-100 hover:bg-amber-400/40",
  full: "bg-red-500/30 text-red-100 hover:bg-red-500/45",
  closed: "text-muted-foreground line-through opacity-60",
};

const LEGEND: { status: DayOccupancy; label: string; dot: string }[] = [
  { status: "free", label: "Libre", dot: "bg-emerald-500" },
  { status: "partial", label: "Con turnos", dot: "bg-amber-400" },
  { status: "full", label: "Completo", dot: "bg-red-500" },
  { status: "closed", label: "Cerrado", dot: "bg-muted-foreground" },
];

const CALENDAR_FORMATTERS = {
  formatCaption: (date: Date) => {
    const text = captionFormatter.format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
  formatWeekdayName: (date: Date) => WEEKDAY_NAMES[date.getDay()],
};

// Bigger days for thumbs; selection and today as outlines so they don't hide the color
const CALENDAR_CLASS_NAMES = {
  head_cell: "w-10 text-[0.8rem] font-normal text-muted-foreground",
  day: "inline-flex size-10 items-center justify-center rounded-md text-sm transition-colors hover:bg-secondary",
  day_selected: "ring-2 ring-foreground font-semibold",
  day_today: "font-bold underline underline-offset-4",
  cell: "relative p-0.5 text-center",
};

const OccupancyLegend = ({ loading, error }: { loading: boolean; error: string | null }) => (
  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2 pb-1 text-xs text-muted-foreground">
    {loading ? (
      <span>Cargando ocupación…</span>
    ) : error ? (
      <span className="text-red-300">{error}</span>
    ) : (
      LEGEND.map(({ status, label, dot }) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", dot)} />
          {label}
        </span>
      ))
    )}
  </div>
);

export const AgendaDatePicker = ({ dateKey, label, employeeId }: AgendaDatePickerProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => keyToDate(dateKey));
  const { days, error, clearCache } = useMonthOccupancy({ open, month, employeeId });

  const handleOpenChange = (next: boolean) => {
    // Bookings change during the day: drop stale colors and start from the shown date's month
    if (next) {
      clearCache();
      setMonth(keyToDate(dateKey));
    }
    setOpen(next);
  };

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    setOpen(false);
    router.push(agendaHref(dateToKey(date), employeeId));
  };

  const byStatus = (status: DayOccupancy) =>
    Object.entries(days ?? {})
      .filter(([, s]) => s === status)
      .map(([key]) => keyToDate(key));

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          aria-label="Elegir fecha"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-xl font-semibold hover:bg-secondary"
        >
          {label}
          <CalendarDays size={18} className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <Calendar
          mode="single"
          selected={keyToDate(dateKey)}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          weekStartsOn={1}
          showOutsideDays={false}
          formatters={CALENDAR_FORMATTERS}
          modifiers={{
            free: byStatus("free"),
            partial: byStatus("partial"),
            full: byStatus("full"),
            closed: byStatus("closed"),
          }}
          modifiersClassNames={OCCUPANCY_CLASS}
          classNames={CALENDAR_CLASS_NAMES}
        />
        <OccupancyLegend loading={days === null} error={error} />
      </PopoverContent>
    </Popover>
  );
};
