"use client";

import { useFormStatus } from "react-dom";

import { primaryButton } from "@/components/features/booking/wizard-styles";

/** Disabled while the cancellation is being saved, so it can't be sent twice. */
export const CancelSubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? "Cancelando…" : "Sí, cancelar turno"}
    </button>
  );
};
