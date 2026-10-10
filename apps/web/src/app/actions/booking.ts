"use server";

import { after } from "next/server";

import { prisma } from "@ds-studio/database";
import { bookAppointment, isDateInBookingWindow, normalizePhone } from "@ds-studio/database/booking";
import { sendBookingConfirmation } from "@ds-studio/messaging";
import { sendBookingConfirmationEmail } from "@ds-studio/messaging/email";

import { formatDayMonth } from "@/lib/format";
import { notifyNewBooking } from "@/lib/notify";
import { getClientContext, isIpRateLimited, verifyTurnstile } from "@/lib/spam";
import { bookingSchema } from "@/lib/validation/booking";
import type { BookingInput, BookingResult } from "@/types/booking";

const ERRORS = {
  SLOT_TAKEN: "Ese horario se acaba de ocupar. Elige otro, por favor.",
  PHONE_LIMIT: "Ya tienes 2 turnos reservados. Si necesitas otro, escríbenos por WhatsApp.",
  DUPLICATE: "Ya tienes un turno reservado ese día. Si quieres cambiarlo, escríbenos por WhatsApp.",
  SERVICE_NOT_FOUND: "Ese servicio ya no está disponible.",
  RATE_LIMITED: "Recibimos muchas reservas desde tu conexión. Escríbenos por WhatsApp y te ayudamos.",
  BOT_CHECK: "No pudimos verificar que no seas un robot. Recarga la página y prueba de nuevo.",
  GENERIC: "No pudimos guardar tu reserva. Prueba de nuevo o escríbenos por WhatsApp.",
} as const;

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
      customerEmail: data.email,
      source: "ONLINE",
      clientIpHash: ipHash,
    });

    if (!result.ok) return { ok: false, error: ERRORS[result.reason] };

    const { id, serviceName, barberName } = result.appointment;
    // Sent after the response so the customer never waits on Meta or the email provider
    after(() =>
      Promise.all([
        sendBookingConfirmation(id),
        sendBookingConfirmationEmail(id),
        notifyNewBooking({
          customerName: data.name,
          customerPhone: normalizePhone(data.phone),
          serviceName,
          barberName,
          dateLabel: formatDayMonth(data.date),
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
