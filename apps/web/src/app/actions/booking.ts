"use server";

import { after } from "next/server";

import { prisma } from "@ds-studio/database";
import { bookAppointment, isDateInBookingWindow, normalizePhone } from "@ds-studio/database/booking";
import { dateKeyToDbDate } from "@ds-studio/database/dates";
import { sendBookingConfirmation } from "@ds-studio/messaging";

import { MONTH_NAMES } from "@/lib/home-content";
import { notifyNewBooking } from "@/lib/notify";
import { getClientContext, isIpRateLimited, verifyTurnstile } from "@/lib/spam";
import { bookingSchema } from "@/lib/validation/booking";
import type { BookingInput, BookingResult } from "@/types/booking";

const ERRORS = {
  SLOT_TAKEN: "Ese horario se acaba de ocupar. Elegí otro, por favor.",
  PHONE_LIMIT: "Ya tenés 2 turnos reservados. Si necesitás otro, escribinos por WhatsApp.",
  DUPLICATE: "Ya tenés un turno reservado ese día. Si querés cambiarlo, escribinos por WhatsApp.",
  SERVICE_NOT_FOUND: "Ese servicio ya no está disponible.",
  RATE_LIMITED: "Recibimos muchas reservas desde tu conexión. Escribinos por WhatsApp y te ayudamos.",
  BOT_CHECK: "No pudimos verificar que no seas un robot. Recargá la página y probá de nuevo.",
  GENERIC: "No pudimos guardar tu reserva. Probá de nuevo o escribinos por WhatsApp.",
} as const;

const formatDateLabel = (key: string) => {
  const d = dateKeyToDbDate(key);
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
};

export const createBooking = async (input: BookingInput): Promise<BookingResult> => {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? ERRORS.GENERIC };

  const data = parsed.data;
  // Honeypot: the field is invisible to people, so only bots fill it
  if (data.website) return { ok: false, error: ERRORS.GENERIC };
  if (!isDateInBookingWindow(data.date)) return { ok: false, error: "Esa fecha ya no está disponible." };

  try {
    const { ip, ipHash } = await getClientContext();
    if (!(await verifyTurnstile(data.turnstileToken, ip))) return { ok: false, error: ERRORS.BOT_CHECK };
    if (await isIpRateLimited(ipHash)) return { ok: false, error: ERRORS.RATE_LIMITED };

    const result = await bookAppointment(prisma, {
      serviceId: data.serviceId,
      employeeId: data.employeeId,
      dateKey: data.date,
      time: data.time,
      customerName: data.name,
      customerPhone: data.phone,
      source: "ONLINE",
      clientIpHash: ipHash,
    });

    if (!result.ok) return { ok: false, error: ERRORS[result.reason] };

    const { id, serviceName, barberName } = result.appointment;
    // Sent after the response so the customer never waits on Meta or the email provider
    after(() =>
      Promise.all([
        sendBookingConfirmation(id),
        notifyNewBooking({
          customerName: data.name,
          customerPhone: normalizePhone(data.phone),
          serviceName,
          barberName,
          dateLabel: formatDateLabel(data.date),
          time: data.time,
        }),
      ]),
    );

    return { ok: true, booking: { serviceName, barberName, date: data.date, time: data.time } };
  } catch (error) {
    console.error("[createBooking]", error);
    return { ok: false, error: ERRORS.GENERIC };
  }
};
