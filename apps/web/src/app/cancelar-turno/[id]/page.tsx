import type { Metadata } from "next";
import Link from "next/link";

import { getAppointmentForCancelLink, ONLINE_CANCEL_CUTOFF_MINUTES, type CancelLinkLookup } from "@ds-studio/messaging/email";

import { cancelBookingFromLink } from "@/app/actions/cancel-booking";
import { CancelSubmitButton } from "@/components/features/booking/CancelSubmitButton";
import { MessageCard } from "@/components/ui/MessageCard";

import { primaryButton, secondaryButton } from "@/lib/button-styles";
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
    body: "Este link para cancelar no es válido. Si necesitas cancelar tu turno, escríbenos por WhatsApp.",
  },
  cancelled: {
    title: "Turno cancelado",
    body: "Tu turno está cancelado. ¡Gracias por avisarnos! Cuando quieras, puedes reservar un nuevo horario.",
  },
  too_late: {
    title: "Ya no se puede cancelar online",
    body: `Los turnos se pueden cancelar desde aquí hasta ${CUTOFF_HOURS} horas antes. Escríbenos por WhatsApp y lo vemos.`,
  },
  closed: {
    title: "Este turno ya pasó",
    body: "Este turno ya no se puede cancelar. Si quieres reservar otro horario, te esperamos.",
  },
} as const;

export default async function CancelBookingPage({ params, searchParams }: CancelPageProps) {
  const [{ id }, { t, error }] = await Promise.all([params, searchParams]);
  const [lookup, business] = await Promise.all([lookUp(id, t), getBusinessInfo()]);

  const message = !lookup.ok ? MESSAGES.invalid : lookup.state === "cancelable" ? null : MESSAGES[lookup.state];

  const appointmentLine = lookup.ok && (
    <>
      <p className="font-condensed text-white/70 tracking-wider text-sm uppercase">
        {lookup.appointment.serviceName} con {lookup.appointment.barberName}
      </p>
      <p className="font-display text-xl text-white mt-2">
        {formatDateKey(lookup.appointment.dateKey)} a las {lookup.appointment.time} hs
      </p>
    </>
  );

  if (message || !lookup.ok) {
    const { title, body } = message ?? MESSAGES.invalid;
    return (
      <MessageCard
        eyebrow={appointmentLine}
        title={title}
        actions={
          <>
            <a href={business.whatsappUrl} target="_blank" rel="noopener noreferrer" className={primaryButton}>
              Escribir por WhatsApp
            </a>
            <Link href="/#agendar" className={secondaryButton}>
              Reservar turno
            </Link>
          </>
        }
      >
        <p>{body}</p>
      </MessageCard>
    );
  }

  return (
    <MessageCard
      eyebrow={appointmentLine}
      title={`¿Cancelar tu turno, ${lookup.appointment.firstName}?`}
      actions={
        // `contents`: the form's buttons sit directly in the card's actions row
        <form action={cancelBookingFromLink} className="contents">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="t" value={t} />
          <CancelSubmitButton />
          <Link href="/" className={secondaryButton}>
            Mantener turno
          </Link>
        </form>
      }
    >
      <p>El horario queda libre para otra persona. Si solo quieres cambiarlo, escríbenos por WhatsApp.</p>
      {error && (
        <p role="alert" className="mt-4 text-red-300">
          No pudimos cancelar el turno. Prueba de nuevo o escríbenos por WhatsApp.
        </p>
      )}
    </MessageCard>
  );
}
