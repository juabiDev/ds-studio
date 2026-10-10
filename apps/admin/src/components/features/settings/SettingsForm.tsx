import type { ComponentProps, ReactNode } from "react";

import type { SiteSettingsData } from "@ds-studio/database/settings";

import { SettingsFormShell } from "@/components/features/settings/SettingsFormShell";

import { fieldClass, hintClass, labelClass } from "@/lib/form-styles";
import { WEEKDAYS } from "@/lib/format";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
    <legend className="px-1 text-sm font-medium">{title}</legend>
    {children}
  </fieldset>
);

type TextFieldProps = ComponentProps<"input"> & { id: string; label: string; hint?: string };

/** Labelled input whose `name` matches its id, as the settings action reads it from FormData. */
const TextField = ({ id, label, hint, ...input }: TextFieldProps) => (
  <div>
    <label htmlFor={id} className={labelClass}>{label}</label>
    <input id={id} name={id} className={fieldClass} {...input} />
    {hint && <p className={hintClass}>{hint}</p>}
  </div>
);

const ContactSection = ({ settings }: { settings: SiteSettingsData }) => (
  <Section title="Contacto">
    <TextField id="phone" label="Teléfono" type="tel" defaultValue={settings.phone} required hint="Se muestra tal cual, por ejemplo +598 99 123 456." />
    <TextField id="whatsapp" label="WhatsApp (opcional)" type="tel" defaultValue={settings.whatsapp ?? ""} hint="Solo si es distinto del teléfono." />
    <TextField id="email" label="Email" type="email" defaultValue={settings.email} required />
  </Section>
);

const LocationSection = ({ settings }: { settings: SiteSettingsData }) => (
  <Section title="Ubicación">
    <TextField id="street" label="Dirección" defaultValue={settings.street} required />
    <TextField
      id="neighborhood"
      label="Barrio (opcional)"
      defaultValue={settings.neighborhood ?? ""}
      placeholder="Pocitos"
      hint="Aparece en el sitio y ayuda a que te encuentren en Google (ej. «barbería en Pocitos»)."
    />
    <TextField
      id="postalCode"
      label="Código postal (opcional)"
      defaultValue={settings.postalCode ?? ""}
      inputMode="numeric"
      maxLength={5}
      placeholder="11300"
    />
    <TextField id="city" label="Ciudad" defaultValue={settings.city} required />
    <TextField
      id="coordinates"
      label="Coordenadas del mapa"
      defaultValue={`${settings.latitude}, ${settings.longitude}`}
      required
      inputMode="decimal"
      hint="En Google Maps, mantén presionado sobre el local (en computadora, clic derecho) y copia los números (ej. -34.906, -56.178)."
    />
  </Section>
);

const SocialSection = ({ settings }: { settings: SiteSettingsData }) => (
  <Section title="Redes sociales">
    <TextField
      id="instagramUrl"
      label="Instagram"
      type="url"
      placeholder="https://instagram.com/usuario"
      defaultValue={settings.instagramUrl ?? ""}
    />
    <TextField
      id="facebookUrl"
      label="Facebook"
      type="url"
      placeholder="https://facebook.com/pagina"
      defaultValue={settings.facebookUrl ?? ""}
      hint="Deja vacío para ocultar el link en el sitio."
    />
  </Section>
);

const OpeningHoursSection = ({ settings }: { settings: SiteSettingsData }) => (
  <Section title="Horario de atención">
    <p className="-mt-1 text-xs text-muted-foreground">
      Es el horario que se muestra en el sitio. Los turnos disponibles se manejan en Horarios.
    </p>
    <ul className="flex flex-col gap-3">
      {WEEKDAYS.map(({ value, label: dayLabel }) => {
        const hours = settings.openingHours[value];
        return (
          // Mobile: day on its own row, both times below at full width. sm+: one row.
          <li key={value} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[6.5rem_1fr_1fr]">
            <label className="col-span-2 flex min-h-11 items-center gap-2 text-sm sm:col-span-1">
              <input type="checkbox" name={`${value}.open`} defaultChecked={hours !== null} className="size-5" />
              {dayLabel}
            </label>
            <input
              type="time"
              name={`${value}.opens`}
              aria-label={`${dayLabel}: abre`}
              defaultValue={hours?.opens ?? "09:00"}
              className={fieldClass}
            />
            <input
              type="time"
              name={`${value}.closes`}
              aria-label={`${dayLabel}: cierra`}
              defaultValue={hours?.closes ?? "20:00"}
              className={fieldClass}
            />
          </li>
        );
      })}
    </ul>
    <p className={hintClass}>Desmarca el día si el local cierra.</p>
  </Section>
);

// Server component with uncontrolled inputs: the server renders every value, the client shell only tracks the save status.
export const SettingsForm = ({ settings }: { settings: SiteSettingsData }) => (
  <SettingsFormShell>
    <ContactSection settings={settings} />
    <LocationSection settings={settings} />
    <SocialSection settings={settings} />
    <OpeningHoursSection settings={settings} />
  </SettingsFormShell>
);
