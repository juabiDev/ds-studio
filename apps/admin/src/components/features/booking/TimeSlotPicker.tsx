import { cn } from "@ds-studio/ui/utils";

import { EmptyState } from "@/components/ui/EmptyState";

import { labelClass } from "@/lib/form-styles";

interface TimeSlotPickerProps {
  /** null while loading */
  times: string[] | null;
  selected: string | null;
  onSelect: (time: string) => void;
}

export const TimeSlotPicker = ({ times, selected, onSelect }: TimeSlotPickerProps) => (
  <fieldset>
    <legend className={labelClass}>Horario libre</legend>
    {times === null ? (
      <p className="text-sm text-muted-foreground">Cargando horarios…</p>
    ) : times.length === 0 ? (
      <EmptyState className="p-4 text-sm">No hay horarios libres para este barbero ese día.</EmptyState>
    ) : (
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {times.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={selected === t}
            onClick={() => onSelect(t)}
            className={cn(
              "min-h-11 rounded-md border text-sm tabular-nums",
              selected === t ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    )}
  </fieldset>
);
