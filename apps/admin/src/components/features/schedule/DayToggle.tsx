"use client";

import { useState } from "react";

import type { DayOfWeek } from "@ds-studio/database";

import { setDayAvailability } from "@/app/actions/schedule";

interface DayToggleProps {
  employeeId: string;
  day: DayOfWeek;
  dayLabel: string;
}

// Bulk shortcut for a day off (or undoing one). The page re-renders with fresh data via revalidatePath.
export const DayToggle = ({ employeeId, day, dayLabel }: DayToggleProps) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async (available: boolean) => {
    if (!available && !window.confirm(`¿Bloquear todos los horarios del ${dayLabel.toLowerCase()}?`)) return;
    setPending(true);
    setError(null);
    const result = await setDayAvailability({ employeeId, day, available });
    setPending(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={pending}
          onClick={() => apply(false)}
          className="min-h-11 rounded-md border border-border text-sm hover:bg-secondary disabled:opacity-50"
        >
          Bloquear día
        </button>
        <button
          disabled={pending}
          onClick={() => apply(true)}
          className="min-h-11 rounded-md border border-border text-sm hover:bg-secondary disabled:opacity-50"
        >
          Habilitar día
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
};
