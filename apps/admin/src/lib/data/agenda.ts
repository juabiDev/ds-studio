import "server-only";

import { prisma, type Prisma } from "@ds-studio/database";
import { dateKeyToDbDate } from "@ds-studio/database/dates";
import { EMAIL_KINDS } from "@ds-studio/messaging/email";

/** Outbound messages shown on the agenda card, newest first per kind. */
export const AGENDA_MESSAGE_KINDS = {
  whatsappConfirmation: "booking_confirmation",
  ...EMAIL_KINDS,
} as const;

export type AgendaMessageKind = (typeof AGENDA_MESSAGE_KINDS)[keyof typeof AGENDA_MESSAGE_KINDS];

const agendaAppointmentSelect = {
  id: true,
  time: true,
  durationMinutes: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  status: true,
  source: true,
  customerConfirmedAt: true,
  cancelledBy: true,
  employeeId: true,
  messages: {
    where: { kind: { in: Object.values(AGENDA_MESSAGE_KINDS) }, direction: "OUTBOUND" },
    // Only a few per appointment (one per kind, plus failed retries), so no limit is needed
    orderBy: { createdAt: "desc" },
    select: { kind: true, status: true },
  },
  service: { select: { name: true } },
  employee: { select: { name: true } },
} satisfies Prisma.AppointmentSelect;

export type AgendaAppointment = Prisma.AppointmentGetPayload<{ select: typeof agendaAppointmentSelect }>;

/** Status of the newest message of one kind, or undefined if none was sent. */
export const latestMessageStatus = (a: AgendaAppointment, kind: AgendaMessageKind) =>
  a.messages.find((m) => m.kind === kind)?.status;

export const getDayAppointments = (dateKey: string, employeeId: string | null) =>
  prisma.appointment.findMany({
    where: { date: dateKeyToDbDate(dateKey), deletedAt: null, ...(employeeId ? { employeeId } : {}) },
    orderBy: [{ time: "asc" }, { createdAt: "asc" }],
    select: agendaAppointmentSelect,
  });

/** Closures (whole shop, or the filtered barber) covering one day. */
export const getDayClosures = (dateKey: string, employeeId: string | null) => {
  const date = dateKeyToDbDate(dateKey);
  return prisma.closure.findMany({
    where: {
      deletedAt: null,
      startDate: { lte: date },
      endDate: { gte: date },
      ...(employeeId ? { OR: [{ employeeId: null }, { employeeId }] } : {}),
    },
    select: { id: true, reason: true, employee: { select: { name: true } } },
  });
};

export type DayClosure = Awaited<ReturnType<typeof getDayClosures>>[number];
