"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { addDaysToKey, toShopDateKey } from "@ds-studio/database/dates";

import { createBooking } from "@/app/actions/booking";
import { BookingConfirmation } from "@/components/features/booking/BookingConfirmation";
import { DetailsStep } from "@/components/features/booking/DetailsStep";
import { ScheduleStep } from "@/components/features/booking/ScheduleStep";
import { ServiceStep } from "@/components/features/booking/ServiceStep";
import { StepIndicator } from "@/components/features/booking/StepIndicator";

import { useOpenTimes } from "@/hooks/use-open-times";
import { ANY_BARBER, fetchOpenTimes } from "@/lib/availability";
import { SELECT_SERVICE_EVENT, type SelectServiceEvent } from "@/lib/booking-events";
import { formatDateKey } from "@/lib/format";
import type { BarberOption, ConfirmedBooking, ServiceOption } from "@/types/booking";

interface BookingWizardProps {
  services: ServiceOption[];
  barbers: BarberOption[];
  whatsappUrl: string;
  /** Cloudflare Turnstile site key; the bot check is skipped when null */
  turnstileSiteKey: string | null;
}

type Step = 1 | 2 | 3;

const DAYS_SHOWN = 14;

// Owns the wizard state and server calls; each step is a presentational component.
export const BookingWizard = ({ services, barbers, whatsappUrl, turnstileSiteKey }: BookingWizardProps) => {
  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberChoice, setBarberChoice] = useState<string>(ANY_BARBER);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onTurnstileToken = useCallback((token: string | null) => setTurnstileToken(token), []);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const { times, setTimes, timesError } = useOpenTimes({ enabled: step === 2, serviceId, barberChoice, dateKey });

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
      setSlotNotice(`Las ${time} se acaban de ocupar. Elige otro horario.`);
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
      email,
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
    setEmail("");
    setError(null);
    setSlotNotice(null);
  };

  const changeBarber = (choice: string) => {
    setBarberChoice(choice);
    setTime(null);
  };

  const changeDate = (key: string) => {
    setDateKey(key);
    setTime(null);
  };

  const changeTime = (t: string) => {
    setTime(t);
    setSlotNotice(null);
  };

  if (confirmed) {
    return <BookingConfirmation booking={confirmed} email={email} whatsappUrl={whatsappUrl} onReset={reset} />;
  }

  return (
    <>
      <StepIndicator step={step} />

      {step === 1 && <ServiceStep services={services} selectedId={serviceId} onSelect={goToSchedule} />}

      {step === 2 && (
        <ScheduleStep
          barbers={barbers}
          barberChoice={barberChoice}
          onBarberChange={changeBarber}
          dateKeys={dateKeys}
          dateKey={dateKey}
          onDateChange={changeDate}
          times={times}
          timesError={timesError}
          time={time}
          onTimeChange={changeTime}
          slotNotice={slotNotice}
          checking={checking}
          onBack={() => setStep(1)}
          onContinue={continueToDetails}
        />
      )}

      {step === 3 && (
        <DetailsStep
          summary={[
            { label: "Servicio", value: service?.name ?? "" },
            { label: "Barbero", value: barberName },
            { label: "Fecha", value: dateKey ? formatDateKey(dateKey) : "" },
            { label: "Horario", value: `${time} hs` },
          ]}
          name={name}
          onNameChange={setName}
          phone={phone}
          onPhoneChange={setPhone}
          email={email}
          onEmailChange={setEmail}
          website={website}
          onWebsiteChange={setWebsite}
          turnstileSiteKey={turnstileSiteKey}
          turnstileToken={turnstileToken}
          onTurnstileToken={onTurnstileToken}
          error={error}
          submitting={submitting}
          onBack={() => setStep(2)}
          onSubmit={() => void submit()}
        />
      )}
    </>
  );
};
