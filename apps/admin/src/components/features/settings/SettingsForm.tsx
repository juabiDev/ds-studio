"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import type { SiteSettingsData } from "@ds-studio/database/settings";

import { updateSiteSettings } from "@/app/actions/settings";

import { WEEKDAYS } from "@/lib/format";

const field = "h-12 w-full rounded-md border border-border bg-input px-3 text-base";
const label = "mb-1.5 block text-sm text-muted-foreground";
const hint = "mt-1 text-xs text-muted-foreground";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
    <legend className="px-1 text-sm font-medium">{title}</legend>
    {children}
  </fieldset>
);

// Uncontrolled inputs: the server renders every value, the client only tracks the save status.
export const SettingsForm = ({ settings }: { settings: SiteSettingsData }) => {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const result = await updateSiteSettings(new FormData(event.currentTarget));
    setSaving(false);
    setStatus(
      result.ok
        ? { ok: true, message: "Guardado. El sitio se actualiza en hasta 5 minutos." }
        : { ok: false, message: result.error },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Section title="Contacto">
        <div>
          <label htmlFor="phone" className={label}>Teléfono</label>
          <input id="phone" name="phone" type="tel" defaultValue={settings.phone} required className={field} />
          <p className={hint}>Se muestra tal cual, por ejemplo +598 99 123 456.</p>
        </div>
        <div>
          <label htmlFor="whatsapp" className={label}>WhatsApp (opcional)</label>
          <input id="whatsapp" name="whatsapp" type="tel" defaultValue={settings.whatsapp ?? ""} className={field} />
          <p className={hint}>Solo si es distinto del teléfono.</p>
        </div>
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" defaultValue={settings.email} required className={field} />
        </div>
      </Section>

      <Section title="Ubicación">
        <div>
          <label htmlFor="street" className={label}>Dirección</label>
          <input id="street" name="street" defaultValue={settings.street} required className={field} />
        </div>
        <div>
          <label htmlFor="city" className={label}>Ciudad</label>
          <input id="city" name="city" defaultValue={settings.city} required className={field} />
        </div>
        <div>
          <label htmlFor="coordinates" className={label}>Coordenadas del mapa</label>
          <input
            id="coordinates"
            name="coordinates"
            defaultValue={`${settings.latitude}, ${settings.longitude}`}
            required
            inputMode="decimal"
            className={field}
          />
          <p className={hint}>En Google Maps, clic derecho sobre el local y copiá los números (ej. -34.906, -56.178).</p>
        </div>
      </Section>

      <Section title="Redes sociales">
        <div>
          <label htmlFor="instagramUrl" className={label}>Instagram</label>
          <input
            id="instagramUrl"
            name="instagramUrl"
            type="url"
            placeholder="https://instagram.com/usuario"
            defaultValue={settings.instagramUrl ?? ""}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="facebookUrl" className={label}>Facebook</label>
          <input
            id="facebookUrl"
            name="facebookUrl"
            type="url"
            placeholder="https://facebook.com/pagina"
            defaultValue={settings.facebookUrl ?? ""}
            className={field}
          />
          <p className={hint}>Dejá vacío para ocultar el link en el sitio.</p>
        </div>
      </Section>

      <Section title="Horario de atención">
        <p className="-mt-1 text-xs text-muted-foreground">
          Es el horario que se muestra en el sitio. Los turnos disponibles se manejan en Horarios.
        </p>
        <ul className="flex flex-col gap-3">
          {WEEKDAYS.map(({ value, label: dayLabel }) => {
            const hours = settings.openingHours[value];
            return (
              <li key={value} className="grid grid-cols-[6.5rem_1fr_1fr] items-center gap-2">
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name={`${value}.open`} defaultChecked={hours !== null} className="size-5" />
                  {dayLabel}
                </label>
                <input
                  type="time"
                  name={`${value}.opens`}
                  aria-label={`${dayLabel}: abre`}
                  defaultValue={hours?.opens ?? "09:00"}
                  className={field}
                />
                <input
                  type="time"
                  name={`${value}.closes`}
                  aria-label={`${dayLabel}: cierra`}
                  defaultValue={hours?.closes ?? "20:00"}
                  className={field}
                />
              </li>
            );
          })}
        </ul>
        <p className={hint}>Destildá el día si el local cierra.</p>
      </Section>

      {status && (
        <p role={status.ok ? "status" : "alert"} className={`text-sm ${status.ok ? "text-emerald-300" : "text-red-300"}`}>
          {status.message}
        </p>
      )}

      <button type="submit" disabled={saving} className="h-12 rounded-md bg-primary text-base font-medium text-primary-foreground disabled:opacity-40">
        {saving ? "Guardando…" : "Guardar ajustes"}
      </button>
    </form>
  );
};
