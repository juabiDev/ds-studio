"use client";

import { useState, type FormEvent } from "react";

import { cn } from "@ds-studio/ui/utils";

import { updateBarberProfile } from "@/app/actions/barbers";

import type { BarberProfile } from "@/lib/data/employees";
import { fieldClass, hintClass, labelClass, submitClass } from "@/lib/form-styles";

export const BarberProfileForm = ({ barber }: { barber: BarberProfile }) => {
  const [name, setName] = useState(barber.name);
  const [role, setRole] = useState(barber.role);
  const [specialty, setSpecialty] = useState(barber.specialty ?? "");
  const [experience, setExperience] = useState(barber.experience ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    const result = await updateBarberProfile({ employeeId: barber.id, name, role, specialty, experience });
    setSaving(false);
    setStatus(result.ok ? { ok: true, message: "Guardado. El sitio ya muestra los cambios." } : { ok: false, message: result.error });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h2 className="font-medium">Datos públicos</h2>
      <div>
        <label htmlFor="barber-name" className={labelClass}>Nombre</label>
        <input id="barber-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="barber-role" className={labelClass}>Rol</label>
        <input
          id="barber-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          maxLength={40}
          placeholder="Barbero Senior"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="barber-specialty" className={labelClass}>Especialidad (opcional)</label>
        <input
          id="barber-specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          maxLength={60}
          placeholder="Fade & Diseño"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="barber-experience" className={labelClass}>Experiencia (opcional)</label>
        <input
          id="barber-experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          maxLength={30}
          placeholder="6 años"
          className={fieldClass}
        />
        <p className={hintClass}>En el sitio se lee «6 años de experiencia».</p>
      </div>

      {status && (
        <p role={status.ok ? "status" : "alert"} className={cn("text-sm", status.ok ? "text-emerald-300" : "text-red-300")}>
          {status.message}
        </p>
      )}

      <button type="submit" disabled={saving} className={submitClass}>
        {saving ? "Guardando…" : "Guardar datos"}
      </button>
    </form>
  );
};
