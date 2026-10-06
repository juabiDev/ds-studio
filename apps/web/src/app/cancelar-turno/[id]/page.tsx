import type { Metadata } from "next";
import Link from "next/link";

import { getAppointmentForCancelLink, ONLINE_CANCEL_CUTOFF_MINUTES, type CancelLinkLookup } from "@ds-studio/messaging/email";

import { cancelBookingFromLink } from "@/app/actions/cancel-booking";
import { CancelSubmitButton } from "@/components/features/booking/CancelSubmitButton";
import { primaryButton, secondaryButton } from "@/components/features/booking/wizard-styles";

import { getBusinessInfo } from "@/lib/data/business";
import { formatDateKey } from "@/lib/format";
import { cancelLinkSchema } from "@/lib/validation/booking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cancelar turno",
  robots: { index: false, follow: false },
  // The link carries the signed token; don't leak it to WhatsApp/Maps through the Referer header
  referrer: "no-referrer",
};

interface CancelPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; error?: string }>;
}

const CUTOFF_HOURS = ONLINE_CANCEL_CUTOFF_MINUTES / 60;

const lookUp = async (id: string, t: string | undefined): Promise<CancelLinkLookup> => {
  const parsed = cancelLinkSchema.safeParse({ id, t });
  if (!parsed.success) return { ok: false };
  try {
    return await getAppointmentForCancelLink(parsed.data.id, parsed.data.t);
  } catch (error) {
    console.error("[cancelar-turno]", error);
    return { ok: false };
  }
};

const MESSAGES = {
  invalid: {
    title: "Link inválido",
    body: "Este link para cancelar no es válido. Si necesitás cancelar tu turno, escribinos por WhatsApp.",
  },
  cancelled: {
    title: "Turno cancelado",
    body: "Tu turno está cancelado. ¡Gracias por avisarnos! Cuando quieras, podés reservar un nuevo horario.",
  },
  too_late: {
    title: "Ya no se puede cancelar online",
    body: `Los turnos se pueden cancelar desde acá hasta ${CUTOFF_HOURS} horas antes. Escribinos por WhatsApp y lo vemos.`,
  },
  closed: {
    title: "Este turno ya pasó",
    body: "Este turno ya no se puede cancelar. Si querés reservar otro horario, te esperamos.",
  },
} as const;

export default async function CancelBookingPage({ params, searchParams }: CancelPageProps) {
  const [{ id }, { t, error }] = await Promise.all([params, searchParams]);
  const [lookup, business] = await Promise.all([lookUp(id, t), getBusinessInfo()]);

  const message = !lookup.ok ? MESSAGES.invalid : lookup.state === "cancelable" ? null : MESSAGES[lookup.state];

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center border border-white/15 px-6 py-12">
        <Link href="/" className="font-display text-white text-xl font-bold tracking-[0.3em]">
          DS STUDIO
        </Link>

        {lookup.ok && (
          <div className="mt-8">
            <p className="font-condensed text-white/70 tracking-wider text-sm uppercase">
              {lookup.appointment.serviceName} con {lookup.appointment.barberName}
            </p>
            <p className="font-display text-xl text-white mt-2">
              {formatDateKey(lookup.appointment.dateKey)} a las {lookup.appointment.time} hs
            </p>
          </div>
        )}

        {message ? (
          <>
            <h1 className="font-display text-3xl font-bold text-white mt-8 mb-3">{message.title}</h1>
            <p className="font-body text-white/65 text-sm max-w-xs mx-auto">{message.body}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a href={business.whatsappUrl} target="_blank" rel="noopener noreferrer" className={primaryButton}>
                Escribir por WhatsApp
              </a>
              <Link href="/#agendar" className={secondaryButton}>
                Reservar turno
              </Link>
            </div>
          </>
        ) : (
          lookup.ok && (
            <>
              <h1 className="font-display text-3xl font-bold text-white mt-8 mb-3">
                ¿Cancelar tu turno, {lookup.appointment.firstName}?
              </h1>
              <p className="font-body text-white/65 text-sm max-w-xs mx-auto">
                El horario queda libre para otra persona. Si solo querés cambiarlo, escribinos por WhatsApp.
              </p>
              {error && (
                <p role="alert" className="mt-4 font-body text-sm text-red-300">
                  No pudimos cancelar el turno. Probá de nuevo o escribinos por WhatsApp.
                </p>
              )}
              <form action={cancelBookingFromLink} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="t" value={t} />
                <CancelSubmitButton />
                <Link href="/" className={secondaryButton}>
                  Mantener turno
                </Link>
              </form>
            </>
          )
        )}
      </div>
    </main>
  );
}
