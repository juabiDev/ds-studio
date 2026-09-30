"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { createAdminBooking, getAdminOpenTimes } from "@/app/actions/booking";

interface AdminBookingFormProps {
  services: { id: string; name: string }[];
  barbers: { id: string; name: string }[];
  initialDate: string;
  minDate: string;
}

// text-base (16px) keeps iOS from zooming into the field; h-12 keeps targets thumb-sized
const field = "h-12 w-full rounded-md border border-border bg-input px-3 text-base";
const label = "mb-1.5 block text-sm text-muted-foreground";

export const AdminBookingForm = ({ services, barbers, initialDate, minDate }: AdminBookingFormProps) => {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState(barbers[0]?.id ?? "");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState<string | null>(null);
  const [times, setTimes] = useState<string[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId || !employeeId || !date) return;

    let cancelled = false;
    setTimes(null);
    setTime(null);
    getAdminOpenTimes({ serviceId, employeeId, date }).then((result) => {
      if (cancelled) return;
      if (result.ok) setTimes(result.times);
      else {
        setTimes([]);
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [serviceId, employeeId, date]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!time) return;
    setSaving(true);
    setError(null);

    const result = await createAdminBooking({ serviceId, employeeId, date, time, name, phone });
    setSaving(false);

    if (result.ok) router.push(`/?fecha=${date}`);
    else setError(result.error);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="service" className={label}>Servicio</label>
          <select id="service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={field}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="barber" className={label}>Barbero</label>
          <select id="barber" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={field}>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className={label}>Fecha</label>
          <input id="date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} required className={field} />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Horario libre</legend>
        {times === null ? (
          <p className="text-sm text-muted-foreground">Cargando horarios…</p>
        ) : times.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No hay horarios libres para este barbero ese día.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {times.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={time === t}
                onClick={() => setTime(t)}
                className={`min-h-11 rounded-md border text-sm tabular-nums ${
                  time === t ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>Nombre del cliente</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" className={field} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>Teléfono (opcional)</label>
          <input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" className={field} />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={!time || !name || saving}
        className="h-12 rounded-md bg-primary text-base font-medium text-primary-foreground disabled:opacity-40"
      >
        {saving ? "Guardando…" : time ? `Agendar a las ${time}` : "Elegí un horario"}
      </button>
    </form>
  );
};
