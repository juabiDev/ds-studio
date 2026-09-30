"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Check, ChevronRight, Users } from "lucide-react";

import { addDaysToKey, dateKeyToDbDate, toShopDateKey } from "@ds-studio/database/dates";

import { TurnstileWidget } from "@/components/features/home/TurnstileWidget";

import { createBooking } from "@/app/actions/booking";
import { SELECT_SERVICE_EVENT, type SelectServiceEvent } from "@/lib/booking-events";
import { DAY_NAMES, MONTH_NAMES } from "@/lib/home-content";
import type { BarberOption, BookingResult, ServiceOption } from "@/types/booking";

interface BookingWizardProps {
  services: ServiceOption[];
  barbers: BarberOption[];
  whatsappUrl: string;
  /** Cloudflare Turnstile site key; the bot check is skipped when null */
  turnstileSiteKey: string | null;
}

type Step = 1 | 2 | 3;
type ConfirmedBooking = Extract<BookingResult, { ok: true }>["booking"];

const ANY_BARBER = "any";
const DAYS_SHOWN = 14;
const STEP_LABELS = ["Servicio", "Horario", "Confirmar"];

const optionClass = (selected: boolean) =>
  `border transition-all duration-200 ${selected ? "border-white bg-white/5" : "border-white/15 hover:border-white/40"}`;

const fetchOpenTimes = async (
  params: { serviceId: string; barberChoice: string; dateKey: string },
  signal?: AbortSignal,
): Promise<string[]> => {
  const query = new URLSearchParams({ date: params.dateKey, serviceId: params.serviceId });
  if (params.barberChoice !== ANY_BARBER) query.set("employeeId", params.barberChoice);

  const res = await fetch(`/api/availability?${query}`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`availability ${res.status}`);
  return ((await res.json()) as { times: string[] }).times;
};

const formatDateKey = (key: string) => {
  const d = dateKeyToDbDate(key);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
};

/** Primary/secondary actions: pinned to the bottom of the screen on mobile, inline on desktop. */
const StepActions = ({ children }: { children: ReactNode }) => (
  <div className="sticky bottom-0 z-10 -mx-6 mt-8 flex gap-3 border-t border-white/10 bg-background/95 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
    {children}
  </div>
);

const primaryButton =
  "flex-1 md:flex-none inline-flex items-center justify-center gap-2 min-h-12 bg-white text-black font-condensed tracking-[0.25em] uppercase text-xs px-8 disabled:opacity-30 hover:bg-white/90 transition-all";
const secondaryButton =
  "inline-flex items-center justify-center min-h-12 border border-white/25 text-white/70 font-condensed tracking-[0.25em] uppercase text-xs px-6 hover:border-white/50 hover:text-white transition-all";
const sectionLabel = "font-condensed text-white/65 text-xs tracking-[0.35em] uppercase mb-4";

export const BookingWizard = ({ services, barbers, whatsappUrl, turnstileSiteKey }: BookingWizardProps) => {
  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberChoice, setBarberChoice] = useState<string>(ANY_BARBER);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [times, setTimes] = useState<string[] | null>(null);
  const [timesError, setTimesError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onTurnstileToken = useCallback((token: string | null) => setTurnstileToken(token), []);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const barberName =
    barberChoice === ANY_BARBER ? "Cualquiera" : (barbers.find((b) => b.id === barberChoice)?.name ?? "");

  // Only rendered from step 2 on, so it never runs during server rendering (no hydration mismatch)
  const dateKeys = useMemo(() => {
    const today = toShopDateKey();
    return Array.from({ length: DAYS_SHOWN }, (_, i) => addDaysToKey(today, i));
  }, []);

  const goToSchedule = (id: string) => {
    setServiceId(id);
    setDateKey((current) => current ?? toShopDateKey());
    setTime(null);
    setStep(2);
  };

  // "Agendar" buttons elsewhere on the page jump straight to picking a time
  useEffect(() => {
    const onSelect = (event: Event) => goToSchedule((event as SelectServiceEvent).detail.serviceId);
    window.addEventListener(SELECT_SERVICE_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_SERVICE_EVENT, onSelect);
  }, []);

  useEffect(() => {
    if (step !== 2 || !serviceId || !dateKey) return;

    const controller = new AbortController();

    setTimes(null);
    setTimesError(false);
    fetchOpenTimes({ serviceId, barberChoice, dateKey }, controller.signal)
      .then(setTimes)
      .catch(() => {
        if (!controller.signal.aborted) setTimesError(true);
      });

    return () => controller.abort();
  }, [step, serviceId, barberChoice, dateKey]);

  /**
   * Re-checks the chosen time right before moving on / submitting, so the customer learns a slot
   * was taken before typing their details. The server still re-checks inside the transaction.
   */
  const confirmStillAvailable = async () => {
    if (!serviceId || !dateKey || !time) return false;
    try {
      const fresh = await fetchOpenTimes({ serviceId, barberChoice, dateKey });
      setTimes(fresh);
      if (fresh.includes(time)) return true;

      setTime(null);
      setStep(2);
      setSlotNotice(`Las ${time} se acaban de ocupar. Elegí otro horario.`);
      return false;
    } catch {
      // The check itself failed (e.g. flaky connection): let the server-side check decide
      return true;
    }
  };

  const continueToDetails = async () => {
    setChecking(true);
    const available = await confirmStillAvailable();
    setChecking(false);
    if (available) {
      setSlotNotice(null);
      setStep(3);
    }
  };

  const submit = async () => {
    if (!serviceId || !dateKey || !time) return;
    setSubmitting(true);
    setError(null);

    if (!(await confirmStillAvailable())) {
      setSubmitting(false);
      return;
    }

    const result = await createBooking({
      serviceId,
      employeeId: barberChoice === ANY_BARBER ? null : barberChoice,
      date: dateKey,
      time,
      name,
      phone,
      website,
      turnstileToken: turnstileToken ?? undefined,
    });

    setSubmitting(false);
    if (result.ok) setConfirmed(result.booking);
    else setError(result.error);
  };

  const reset = () => {
    setConfirmed(null);
    setStep(1);
    setServiceId(null);
    setBarberChoice(ANY_BARBER);
    setDateKey(null);
    setTime(null);
    setName("");
    setPhone("");
    setError(null);
    setSlotNotice(null);
  };

  if (confirmed) {
    return (
      <div className="text-center py-16 px-6 border border-white/15">
        <div className="w-16 h-16 border-2 border-white/60 rounded-full flex items-center justify-center mx-auto mb-7">
          <Check size={26} className="text-white" />
        </div>
        <h3 className="font-display text-3xl font-bold text-white mb-3">¡Turno reservado!</h3>
        <p className="font-condensed text-white/70 tracking-wider text-sm uppercase mb-1">
          {confirmed.serviceName} con {confirmed.barberName}
        </p>
        <p className="font-display text-xl text-white mt-2">
          {formatDateKey(confirmed.date)} a las {confirmed.time} hs
        </p>
        <p className="font-body text-white/65 text-sm mt-5 max-w-xs mx-auto">
          ¿Necesitás cambiarlo o cancelarlo? Escribinos por WhatsApp.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={primaryButton}>
            Escribir por WhatsApp
          </a>
          <button onClick={reset} className={secondaryButton}>
            Nueva reserva
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Step indicator */}
      <ol className="flex items-center mb-12">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          return (
            <li key={s} className="flex items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center border font-condensed text-xs tracking-wider transition-all duration-300 ${
                  step > s
                    ? "bg-white border-white text-black"
                    : step === s
                      ? "border-white text-white"
                      : "border-white/25 text-white/50"
                }`}
              >
                {step > s ? <Check size={12} /> : s}
              </div>
              <span
                className={`font-condensed text-xs tracking-[0.2em] uppercase ml-2 mr-3 transition-colors ${
                  step >= s ? "text-white" : "text-white/50"
                }`}
              >
                {label}
              </span>
              {i < 2 && <div className={`h-px w-6 sm:w-10 mr-3 ${step > s ? "bg-white" : "bg-white/15"}`} />}
            </li>
          );
        })}
      </ol>

      {/* ── Step 1: Service ── */}
      {step === 1 && (
        <div>
          <p className={sectionLabel}>Elegí un servicio</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((s) => (
              <button key={s.id} onClick={() => goToSchedule(s.id)} className={`text-left p-5 ${optionClass(serviceId === s.id)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display font-bold text-white text-base">{s.name}</p>
                    <p className="font-condensed text-white/65 text-sm tracking-wider mt-1">{s.durationMinutes} min</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {s.price && <span className="font-display text-white font-bold text-base">{s.price}</span>}
                    <ChevronRight size={16} className="text-white/50" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Barber + Date + Time ── */}
      {step === 2 && (
        <div>
          <p className={sectionLabel}>Elegí tu barbero</p>
          <div className="flex gap-3 mb-10 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5">
            <button
              onClick={() => {
                setBarberChoice(ANY_BARBER);
                setTime(null);
              }}
              className={`flex-shrink-0 w-24 sm:w-auto p-3 text-center ${optionClass(barberChoice === ANY_BARBER)}`}
            >
              <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-zinc-800 flex items-center justify-center">
                <Users size={18} className="text-white/70" />
              </div>
              <p className="font-condensed text-white text-sm tracking-wider">Cualquiera</p>
            </button>
            {barbers.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBarberChoice(b.id);
                  setTime(null);
                }}
                className={`flex-shrink-0 w-24 sm:w-auto p-3 text-center ${optionClass(barberChoice === b.id)}`}
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 bg-zinc-800">
                  {b.avatarUrl && <Image src={b.avatarUrl} alt={b.name} fill sizes="48px" className="object-cover" />}
                </div>
                <p className="font-condensed text-white text-sm tracking-wider">{b.name.split(" ")[0]}</p>
              </button>
            ))}
          </div>

          <p className={sectionLabel}>Elegí la fecha</p>
          <div className="flex gap-2 mb-10 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0">
            {dateKeys.map((key, i) => {
              const d = dateKeyToDbDate(key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    setDateKey(key);
                    setTime(null);
                  }}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-3 min-w-[68px] ${optionClass(dateKey === key)}`}
                >
                  <span className="font-condensed text-white/65 text-xs tracking-wider uppercase">
                    {i === 0 ? "Hoy" : i === 1 ? "Mañana" : DAY_NAMES[d.getUTCDay()]}
                  </span>
                  <span className="font-display text-white text-xl font-bold my-0.5">{d.getUTCDate()}</span>
                  <span className="font-condensed text-white/65 text-xs tracking-wider uppercase">
                    {MONTH_NAMES[d.getUTCMonth()]}
                  </span>
                </button>
              );
            })}
          </div>

          <p className={sectionLabel}>Elegí el horario</p>
          {slotNotice && (
            <p role="alert" className="mb-4 border border-amber-400/40 bg-amber-400/10 px-4 py-3 font-body text-sm text-amber-200">
              {slotNotice}
            </p>
          )}
          {timesError ? (
            <p className="font-body text-white/70 text-sm">No pudimos cargar los horarios. Probá de nuevo en un momento.</p>
          ) : times === null ? (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2" aria-busy="true">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-11 bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : times.length === 0 ? (
            <p className="font-body text-white/70 text-sm">
              No quedan horarios para este día{barberChoice !== ANY_BARBER ? " con este barbero" : ""}. Probá otra fecha.
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {times.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTime(t);
                    setSlotNotice(null);
                  }}
                  className={`min-h-11 font-condensed text-sm tracking-wider ${optionClass(time === t)} ${
                    time === t ? "text-white" : "text-white/80"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <StepActions>
            <button onClick={() => setStep(1)} className={secondaryButton}>
              Atrás
            </button>
            <button disabled={!time || checking} onClick={continueToDetails} className={primaryButton}>
              {checking ? "Verificando…" : "Continuar"} {!checking && <ChevronRight size={13} />}
            </button>
          </StepActions>
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="border border-white/15 p-6 mb-8">
            <p className="font-condensed text-white/65 text-xs tracking-[0.35em] uppercase mb-5">Resumen de tu reserva</p>
            <dl className="grid grid-cols-2 gap-5">
              {[
                ["Servicio", service?.name ?? ""],
                ["Barbero", barberName],
                ["Fecha", dateKey ? formatDateKey(dateKey) : ""],
                ["Horario", `${time} hs`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="font-condensed text-white/65 text-xs tracking-wider uppercase mb-1">{label}</dt>
                  <dd className="font-display text-white font-bold text-base">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

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
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 bg-card border border-white/15 text-white placeholder:text-white/50 px-5 font-body text-base focus:border-white/60 focus:outline-none transition-colors"
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
              onChange={(e) => setPhone(e.target.value)}
              className="min-h-12 bg-card border border-white/15 text-white placeholder:text-white/50 px-5 font-body text-base focus:border-white/60 focus:outline-none transition-colors"
            />
          </div>

          {/* Honeypot: off-screen and skipped by keyboard/screen readers; bots fill every field */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="booking-website">Sitio web</label>
            <input
              id="booking-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {turnstileSiteKey && <TurnstileWidget siteKey={turnstileSiteKey} onToken={onTurnstileToken} />}

          {error && (
            <p role="alert" className="mt-4 font-body text-sm text-red-300">
              {error}
            </p>
          )}

          <StepActions>
            <button type="button" onClick={() => setStep(2)} className={secondaryButton}>
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
      )}
    </>
  );
};
