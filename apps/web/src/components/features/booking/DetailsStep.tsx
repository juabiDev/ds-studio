import { Check } from "lucide-react";

import { StepActions } from "@/components/features/booking/StepActions";
import { TurnstileWidget } from "@/components/features/booking/TurnstileWidget";
import { primaryButton, secondaryButton, sectionLabel, textInput } from "@/components/features/booking/wizard-styles";

interface DetailsStepProps {
  summary: { label: string; value: string }[];
  name: string;
  onNameChange: (name: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  website: string;
  onWebsiteChange: (website: string) => void;
  /** Cloudflare Turnstile site key; the bot check is skipped when null */
  turnstileSiteKey: string | null;
  turnstileToken: string | null;
  onTurnstileToken: (token: string | null) => void;
  error: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

const BookingSummary = ({ rows }: { rows: { label: string; value: string }[] }) => (
  <div className="border border-white/15 p-6 mb-8">
    <p className="font-condensed text-white/65 text-xs tracking-[0.35em] uppercase mb-5">Resumen de tu reserva</p>
    <dl className="grid grid-cols-2 gap-5">
      {rows.map(({ label, value }) => (
        <div key={label}>
          <dt className="font-condensed text-white/65 text-xs tracking-wider uppercase mb-1">{label}</dt>
          <dd className="font-display text-white font-bold text-base">{value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

/** Off-screen and skipped by keyboard/screen readers; bots fill every field */
const HoneypotField = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
    <label htmlFor="booking-website">Sitio web</label>
    <input
      id="booking-website"
      type="text"
      tabIndex={-1}
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export const DetailsStep = ({
  summary,
  name,
  onNameChange,
  phone,
  onPhoneChange,
  website,
  onWebsiteChange,
  turnstileSiteKey,
  turnstileToken,
  onTurnstileToken,
  error,
  submitting,
  onBack,
  onSubmit,
}: DetailsStepProps) => (
  <form
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <BookingSummary rows={summary} />

    <p className={sectionLabel}>Tus datos</p>
    <div className="flex flex-col gap-3">
      <label className="sr-only" htmlFor="booking-name">Nombre completo</label>
      <input
        id="booking-name"
        type="text"
        autoComplete="name"
        placeholder="Nombre completo"
        required
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className={textInput}
      />
      <label className="sr-only" htmlFor="booking-phone">Teléfono</label>
      <input
        id="booking-phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="Teléfono (09x xxx xxx)"
        required
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        className={textInput}
      />
    </div>

    <HoneypotField value={website} onChange={onWebsiteChange} />

    {turnstileSiteKey && <TurnstileWidget siteKey={turnstileSiteKey} onToken={onTurnstileToken} />}

    {error && (
      <p role="alert" className="mt-4 font-body text-sm text-red-300">
        {error}
      </p>
    )}

    <StepActions>
      <button type="button" onClick={onBack} className={secondaryButton}>
        Atrás
      </button>
      <button
        type="submit"
        disabled={!name || !phone || submitting || (!!turnstileSiteKey && !turnstileToken)}
        className={primaryButton}
      >
        {submitting ? "Reservando…" : "Confirmar reserva"} {!submitting && <Check size={13} />}
      </button>
    </StepActions>
  </form>
);
