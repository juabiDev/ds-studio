"use client";

import { useState, type FormEvent } from "react";

import { cn } from "@ds-studio/ui/utils";

import type { ServiceInput } from "@/app/actions/services";

import { fieldClass, hintClass, labelClass, submitClass } from "@/lib/form-styles";
import type { ActionResult } from "@/types/admin";

interface ServiceFormProps {
  /** Prefix for input ids, so several forms can share a page */
  idPrefix: string;
  initial: ServiceInput;
  submitLabel: string;
  onSubmit: (input: ServiceInput) => Promise<ActionResult>;
  /** Called after a successful save (e.g. to close the editor) */
  onSaved?: () => void;
  /** Clears the fields after saving; used by the "new service" form */
  resetOnSave?: boolean;
}

export const ServiceForm = ({ idPrefix, initial, submitLabel, onSubmit, onSaved, resetOnSave }: ServiceFormProps) => {
  const [name, setName] = useState(initial.name);
  const [duration, setDuration] = useState(String(initial.duration));
  const [price, setPrice] = useState(initial.price != null ? String(initial.price) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await onSubmit({
      name,
      duration: Number(duration),
      price: price.trim() === "" ? null : Number(price),
    });
    setSaving(false);

    if (!result.ok) return setError(result.error);
    if (resetOnSave) {
      setName(initial.name);
      setDuration(String(initial.duration));
      setPrice(initial.price != null ? String(initial.price) : "");
    }
    onSaved?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor={`${idPrefix}-name`} className={labelClass}>Nombre</label>
        <input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          placeholder="Corte + Barba"
          className={fieldClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idPrefix}-duration`} className={labelClass}>Duración (min)</label>
          <input
            id={`${idPrefix}-duration`}
            type="number"
            inputMode="numeric"
            min={5}
            max={480}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-price`} className={labelClass}>Precio ($)</label>
          <input
            id={`${idPrefix}-price`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Consultar"
            className={fieldClass}
          />
        </div>
      </div>
      <p className={cn(hintClass, "-mt-2")}>
        Deja el precio vacío para mostrar «Consultar». Los cambios se ven en el sitio en hasta 5 minutos.
      </p>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={saving} className={submitClass}>
        {saving ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
};
