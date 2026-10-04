"use client";

import { useState } from "react";

import { Undo2 } from "lucide-react";

import { setAppointmentStatus } from "@/app/actions/agenda";

// Reverts a completed / no-show mark, so a mis-tap on mobile isn't permanent
export const UndoStatusButton = ({ appointmentId }: { appointmentId: string }) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);
    const result = await setAppointmentStatus({ appointmentId, status: "CONFIRMED" });
    setPending(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        <Undo2 size={15} /> {pending ? "…" : "Deshacer"}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
};
