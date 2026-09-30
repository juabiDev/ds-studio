"use client";

import { useState, type FormEvent } from "react";

import { createClosure } from "@/app/actions/closures";

const SHOP = "local";
const field = "h-12 w-full rounded-md border border-border bg-input px-3 text-base";
const label = "mb-1.5 block text-sm text-muted-foreground";

interface ClosureFormProps {
  barbers: { id: string; name: string }[];
  minDate: string;
}

export const ClosureForm = ({ barbers, minDate }: ClosureFormProps) => {
  const [who, setWho] = useState(SHOP);
  const [startDate, setStartDate] = useState(minDate);
  const [endDate, setEndDate] = useState(minDate);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await createClosure({ employeeId: who === SHOP ? null : who, startDate, endDate, reason });
    setSaving(false);

    if (result.ok) setReason("");
    else setError(result.error);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div>
        <label htmlFor="who" className={label}>¿Quién no atiende?</label>
        <select id="who" value={who} onChange={(e) => setWho(e.target.value)} className={field}>
          <option value={SHOP}>Todo el local (feriado)</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="start" className={label}>Desde</label>
          <input
            id="start"
            type="date"
            min={minDate}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value > endDate) setEndDate(e.target.value);
            }}
            required
            className={field}
          />
        </div>
        <div>
          <label htmlFor="end" className={label}>Hasta (inclusive)</label>
          <input id="end" type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} required className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="reason" className={label}>Motivo (opcional)</label>
        <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Feriado, vacaciones…" className={field} />
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={saving} className="h-12 rounded-md bg-primary text-base font-medium text-primary-foreground disabled:opacity-40">
        {saving ? "Guardando…" : "Agregar cierre"}
      </button>
    </form>
  );
};
