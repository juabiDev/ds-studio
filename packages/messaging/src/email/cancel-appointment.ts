import "server-only";

import { prisma } from "@ds-studio/database";
import { dbDateToKey } from "@ds-studio/database/dates";

import { firstName } from "../format";
import { isValidCancelToken, isWithinCancelWindow, minutesUntil } from "./cancel-link";

export interface CancelLinkAppointment {
  firstName: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string;
  barberName: string;
  dateKey: string;
  time: string;
}

/**
 * cancelable: can be cancelled now · too_late: inside the cutoff, must use WhatsApp ·
 * cancelled: already cancelled · closed: already happened (or marked completed / no-show)
 */
export type CancelLinkState = "cancelable" | "too_late" | "cancelled" | "closed";

export type CancelLinkLookup =
  | { ok: true; state: CancelLinkState; appointment: CancelLinkAppointment }
  | { ok: false };

const loadForLink = async (appointmentId: string, token: string) => {
  // Checked before touching the database, so a guessed id reveals nothing
  if (!isValidCancelToken(appointmentId, token)) return null;

  return prisma.appointment.findFirst({
    where: { id: appointmentId, deletedAt: null },
    select: {
      customerName: true,
      customerPhone: true,
      date: true,
      time: true,
      status: true,
      service: { select: { name: true } },
      employee: { select: { name: true } },
    },
  });
};

const stateOf = (status: string, dateKey: string, time: string): CancelLinkState => {
  if (status === "CANCELLED") return "cancelled";
  if (status !== "CONFIRMED" || minutesUntil(dateKey, time) <= 0) return "closed";
  return isWithinCancelWindow(dateKey, time) ? "cancelable" : "too_late";
};

/** What the cancel page shows. Invalid or forged links return ok: false. */
export const getAppointmentForCancelLink = async (appointmentId: string, token: string): Promise<CancelLinkLookup> => {
  const a = await loadForLink(appointmentId, token);
  if (!a) return { ok: false };

  const dateKey = dbDateToKey(a.date);
  return {
    ok: true,
    state: stateOf(a.status, dateKey, a.time),
    appointment: {
      firstName: firstName(a.customerName),
      customerName: a.customerName,
      customerPhone: a.customerPhone,
      serviceName: a.service.name,
      barberName: a.employee.name,
      dateKey,
      time: a.time,
    },
  };
};

export type CancelFromLinkResult =
  | { ok: true; appointment: CancelLinkAppointment }
  | { ok: false; reason: "INVALID" | Exclude<CancelLinkState, "cancelable"> };

/** Cancels on behalf of the customer, re-checking the link and the cutoff at the moment of the click. */
export const cancelAppointmentFromLink = async (appointmentId: string, token: string): Promise<CancelFromLinkResult> => {
  const lookup = await getAppointmentForCancelLink(appointmentId, token);
  if (!lookup.ok) return { ok: false, reason: "INVALID" };
  if (lookup.state !== "cancelable") return { ok: false, reason: lookup.state };

  // Conditional update: a double click (or a WhatsApp tap at the same time) can only cancel once
  const { count } = await prisma.appointment.updateMany({
    where: { id: appointmentId, status: "CONFIRMED", deletedAt: null },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy: "CUSTOMER" },
  });
  if (count === 0) return { ok: false, reason: "cancelled" };

  return { ok: true, appointment: lookup.appointment };
};
