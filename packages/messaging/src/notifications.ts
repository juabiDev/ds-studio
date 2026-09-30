import "server-only";

import { prisma } from "@ds-studio/database";
import { dbDateToKey } from "@ds-studio/database/dates";

import { getPublicSiteUrl, getWhatsAppConfig } from "./config";
import { firstName, formatLongDate, templateParam } from "./format";
import { buttonPayload, createActionToken } from "./tokens";
import { sendTemplate, type SendResult } from "./whatsapp-client";

/** Template names as approved in WhatsApp Manager (see packages/messaging/TEMPLATES.md). */
export const TEMPLATES = {
  bookingConfirmation: "reserva_confirmada",
  staffCancellation: "reserva_cancelada_local",
} as const;

const loadAppointment = (id: string) =>
  prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      date: true,
      time: true,
      status: true,
      deletedAt: true,
      service: { select: { name: true } },
      employee: { select: { name: true } },
    },
  });

const logOutbound = (appointmentId: string, kind: string, result: SendResult) =>
  prisma.messageLog.create({
    data: {
      appointmentId,
      channel: "WHATSAPP",
      direction: "OUTBOUND",
      kind,
      providerMessageId: result.ok ? result.messageId : null,
      status: result.ok ? "SENT" : "FAILED",
      error: result.ok ? null : result.error.slice(0, 500),
    },
  });

/**
 * Sends the booking confirmation with "Confirmo asistencia" / "Cancelar turno" buttons.
 * Never throws: it runs after the response (next/server `after`), and a failed WhatsApp must
 * not affect the booking. Failures are stored in message_logs and shown in the admin agenda.
 */
export const sendBookingConfirmation = async (appointmentId: string) => {
  try {
    const config = getWhatsAppConfig();
    if (!config) {
      console.info("[whatsapp] Not configured; skipping booking confirmation", appointmentId);
      return;
    }

    const appointment = await loadAppointment(appointmentId);
    if (!appointment?.customerPhone || appointment.status !== "CONFIRMED" || appointment.deletedAt) return;

    const { token, hash } = createActionToken();
    await prisma.appointment.update({ where: { id: appointment.id }, data: { actionTokenHash: hash } });

    const result = await sendTemplate(config, {
      to: appointment.customerPhone,
      template: TEMPLATES.bookingConfirmation,
      body: {
        nombre: templateParam(firstName(appointment.customerName)),
        servicio: templateParam(appointment.service.name),
        barbero: templateParam(appointment.employee.name),
        fecha: formatLongDate(dbDateToKey(appointment.date)),
        hora: appointment.time,
      },
      quickReplyPayloads: [buttonPayload("confirm", token), buttonPayload("cancel", token)],
    });

    await logOutbound(appointment.id, "booking_confirmation", result);
    if (!result.ok) console.error("[whatsapp] Booking confirmation failed", appointment.id, result.error);
  } catch (error) {
    console.error("[whatsapp] sendBookingConfirmation", error);
  }
};

/** Tells the customer the shop cancelled their appointment. Never throws. */
export const sendStaffCancellationNotice = async (appointmentId: string) => {
  try {
    const config = getWhatsAppConfig();
    if (!config) {
      console.info("[whatsapp] Not configured; skipping cancellation notice", appointmentId);
      return;
    }

    const appointment = await loadAppointment(appointmentId);
    if (!appointment?.customerPhone || appointment.status !== "CANCELLED") return;

    const result = await sendTemplate(config, {
      to: appointment.customerPhone,
      template: TEMPLATES.staffCancellation,
      body: {
        nombre: templateParam(firstName(appointment.customerName)),
        servicio: templateParam(appointment.service.name),
        fecha: formatLongDate(dbDateToKey(appointment.date)),
        hora: appointment.time,
        sitio: getPublicSiteUrl(),
      },
    });

    await logOutbound(appointment.id, "staff_cancellation", result);
    if (!result.ok) console.error("[whatsapp] Cancellation notice failed", appointment.id, result.error);
  } catch (error) {
    console.error("[whatsapp] sendStaffCancellationNotice", error);
  }
};
