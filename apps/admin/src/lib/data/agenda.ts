import "server-only";

import { prisma, type Prisma } from "@ds-studio/database";
import { dateKeyToDbDate } from "@ds-studio/database/dates";

const agendaAppointmentSelect = {
  id: true,
  time: true,
  durationMinutes: true,
  customerName: true,
  customerPhone: true,
  status: true,
  source: true,
  customerConfirmedAt: true,
  cancelledBy: true,
  employeeId: true,
  messages: {
    where: { kind: "booking_confirmation", direction: "OUTBOUND" },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { status: true },
  },
  service: { select: { name: true } },
  employee: { select: { name: true } },
} satisfies Prisma.AppointmentSelect;

export type AgendaAppointment = Prisma.AppointmentGetPayload<{ select: typeof agendaAppointmentSelect }>;

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
