"use client";

import { useState } from "react";

import type { AppointmentStatus } from "@ds-studio/database";

import { setAppointmentStatus } from "@/app/actions/agenda";

const ACTIONS: { status: AppointmentStatus; label: string; confirm?: string }[] = [
  { status: "COMPLETED", label: "Completado" },
  { status: "NO_SHOW", label: "No vino" },
  { status: "CANCELLED", label: "Cancelar", confirm: "¿Cancelar este turno? El horario vuelve a quedar libre." },
];

export const AppointmentActions = ({ appointmentId }: { appointmentId: string }) => {
  const [pending, setPending] = useState<AppointmentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = async (status: AppointmentStatus, confirmMessage?: string) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setPending(status);
    setError(null);
    const result = await setAppointmentStatus({ appointmentId, status });
    setPending(null);
    if (!result.ok) setError(result.error);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map(({ status, label, confirm }) => (
          <button
            key={status}
            disabled={pending !== null}
            onClick={() => update(status, confirm)}
            className={`min-h-11 rounded-md border text-sm transition-colors disabled:opacity-50 ${
              status === "CANCELLED"
                ? "border-destructive/50 text-red-300 hover:bg-destructive/15"
                : "border-border text-foreground hover:bg-secondary"
            }`}
          >
            {pending === status ? "…" : label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
};
