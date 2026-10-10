"use client";

import { useState } from "react";

import { Switch } from "@ds-studio/ui/switch";

import { setFaqVisibility } from "@/app/actions/faq";

export const FaqVisibilityToggle = ({ visible, hasItems }: { visible: boolean; hasItems: boolean }) => {
  const [checked, setChecked] = useState(visible);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (next: boolean) => {
    // Optimistic: flip now, roll back if the save fails
    setChecked(next);
    setPending(true);
    setError(null);
    const result = await setFaqVisibility({ visible: next });
    setPending(false);
    if (!result.ok) {
      setChecked(!next);
      setError(result.error);
    }
  };

  const status = !checked
    ? "Oculta: la sección no aparece en el sitio."
    : hasItems
      ? "Visible en el sitio."
      : "Activada, pero no se muestra hasta que agregues una pregunta.";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex min-h-11 items-center justify-between gap-4">
        <label htmlFor="faq-visible" className="font-medium">
          Mostrar preguntas frecuentes en el sitio
        </label>
        <Switch
          id="faq-visible"
          checked={checked}
          disabled={pending}
          onCheckedChange={handleChange}
          className="h-7 w-12 [&>span]:size-6"
        />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{status}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
};
