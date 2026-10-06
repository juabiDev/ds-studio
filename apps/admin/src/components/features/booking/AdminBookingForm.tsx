"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createAdminBooking } from "@/app/actions/booking";
import { TimeSlotPicker } from "@/components/features/booking/TimeSlotPicker";

import { useOpenTimes } from "@/hooks/use-open-times";
import { fieldClass, labelClass, submitClass } from "@/lib/form-styles";
import type { NamedOption } from "@/types/admin";

interface AdminBookingFormProps {
  services: NamedOption[];
  barbers: NamedOption[];
  initialDate: string;
  initialEmployeeId: string;
  minDate: string;
}

interface OptionSelectProps {
  id: string;
  label: string;
  value: string;
  options: NamedOption[];
  onChange: (value: string) => void;
}

const OptionSelect = ({ id, label, value, options, onChange }: OptionSelectProps) => (
  <div>
    <label htmlFor={id} className={labelClass}>{label}</label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  </div>
);

export const AdminBookingForm = ({ services, barbers, initialDate, initialEmployeeId, minDate }: AdminBookingFormProps) => {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [date, setDate] = useState(initialDate);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { times, time, setTime } = useOpenTimes({ serviceId, employeeId, date, onError: setError });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!time) return;
    setSaving(true);
    setError(null);

    const result = await createAdminBooking({ serviceId, employeeId, date, time, name, phone, email });
    setSaving(false);

    if (result.ok) router.push(`/?fecha=${date}`);
    else setError(result.error);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <OptionSelect id="service" label="Servicio" value={serviceId} options={services} onChange={setServiceId} />
        <OptionSelect id="barber" label="Barbero" value={employeeId} options={barbers} onChange={setEmployeeId} />
        <div>
          <label htmlFor="date" className={labelClass}>Fecha</label>
          <input id="date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} required className={fieldClass} />
        </div>
      </div>

      <TimeSlotPicker times={times} selected={time} onSelect={setTime} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="name" className={labelClass}>Nombre del cliente</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Teléfono (opcional)</label>
          <input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email (opcional)</label>
          <input id="email" type="email" inputMode="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className={fieldClass} />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={!time || !name || saving} className={submitClass}>
        {saving ? "Guardando…" : time ? `Agendar a las ${time}` : "Elegí un horario"}
      </button>
    </form>
  );
};
