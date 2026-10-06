import "server-only";

import { prisma, type Prisma } from "@ds-studio/database";
import { normalizePhone } from "@ds-studio/database/booking";
import { dateKeyToDbDate, dbDateToKey, shopNowMinutes, timeToMinutes, toShopDateKey } from "@ds-studio/database/dates";
import { getSiteSettings } from "@ds-studio/database/settings-store";

import { getPublicSiteUrl } from "../config";
import { firstName, formatLongDate } from "../format";
import type { SendResult } from "../whatsapp-client";
import { ONLINE_CANCEL_CUTOFF_MINUTES, buildCancelUrl, isWithinCancelWindow } from "./cancel-link";
import { getEmailConfig, sendEmail, type EmailConfig } from "./resend-client";
import {
  appointmentReminderEmail,
  bookingConfirmationEmail,
  staffCancellationEmail,
  type AppointmentEmailData,
  type CancelOption,
  type RenderedEmail,
} from "./templates";

export {
  cancelAppointmentFromLink,
  getAppointmentForCancelLink,
  type CancelLinkLookup,
  type CancelLinkState,
} from "./cancel-appointment";
export { ONLINE_CANCEL_CUTOFF_MINUTES } from "./cancel-link";
export { getEmailConfig, sendEmail } from "./resend-client";

export const EMAIL_KINDS = {
  bookingConfirmation: "booking_confirmation_email",
  reminder: "reminder_email",
  staffCancellation: "staff_cancellation_email",
} as const;

/** Resend's default limit is 2 requests/second; stay under it when sending the daily batch. */
const SEND_INTERVAL_MS = 600;

const appointmentSelect = {
  id: true,
  customerName: true,
  customerEmail: true,
  date: true,
  time: true,
  status: true,
  cancelledAt: true,
  deletedAt: true,
  service: { select: { name: true } },
  employee: { select: { name: true } },
} satisfies Prisma.AppointmentSelect;

type EmailAppointment = NonNullable<Awaited<ReturnType<typeof loadAppointment>>>;

const loadAppointment = (id: string) => prisma.appointment.findUnique({ where: { id }, select: appointmentSelect });

/** Address, phone and links from the admin "Ajustes" page, shared by every email in one run. */
const loadShopDetails = async (): Promise<AppointmentEmailData["shop"]> => {
  const s = await getSiteSettings();
  const whatsapp = s.whatsapp ?? s.phone;

  return {
    address: `${s.street}, ${s.city}`,
    phone: whatsapp,
    whatsappUrl: `https://wa.me/${normalizePhone(whatsapp).replace("+", "")}`,
    mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`,
    siteUrl: getPublicSiteUrl(),
  };
};

const toEmailData = (a: EmailAppointment, shop: AppointmentEmailData["shop"]): AppointmentEmailData => ({
  firstName: firstName(a.customerName),
  serviceName: a.service.name,
  barberName: a.employee.name,
  dateLabel: formatLongDate(dbDateToKey(a.date)),
  time: a.time,
  shop,
});

/** The cancel button is left out once it's too late to cancel online. */
const cancelOptionFor = (a: EmailAppointment): CancelOption => {
  const url = buildCancelUrl(a.id);
  if (!url || !isWithinCancelWindow(dbDateToKey(a.date), a.time)) return null;
  return { url, cutoffHours: ONLINE_CANCEL_CUTOFF_MINUTES / 60 };
};

const logOutboundEmail = (appointmentId: string, kind: string, result: SendResult) =>
  prisma.messageLog.create({
    data: {
      appointmentId,
      channel: "EMAIL",
      direction: "OUTBOUND",
      kind,
      providerMessageId: result.ok ? result.messageId : null,
      status: result.ok ? "SENT" : "FAILED",
      error: result.ok ? null : result.error.slice(0, 500),
    },
  });

interface Delivery {
  appointmentId: string;
  to: string;
  kind: string;
  email: RenderedEmail;
  /** Defaults to kind + appointment, i.e. at most one email of each kind per appointment */
  idempotencyKey?: string;
}

const deliver = async (config: EmailConfig, { appointmentId, to, kind, email, idempotencyKey }: Delivery) => {
  const result = await sendEmail(config, { to, ...email, idempotencyKey: idempotencyKey ?? `${kind}/${appointmentId}` });
  await logOutboundEmail(appointmentId, kind, result);
  if (!result.ok) console.error(`[email] ${kind} failed`, appointmentId, result.error);
  return result.ok;
};

/**
 * Emails the customer their booking details. Never throws: it runs after the response
 * (next/server `after`), and a failed email must not affect the booking.
 */
export const sendBookingConfirmationEmail = async (appointmentId: string) => {
  try {
    const config = getEmailConfig();
    if (!config) {
      console.info("[email] Not configured; skipping booking confirmation", appointmentId);
      return;
    }

    const appointment = await loadAppointment(appointmentId);
    if (!appointment?.customerEmail || appointment.status !== "CONFIRMED" || appointment.deletedAt) return;

    const shop = await loadShopDetails();
    const email = bookingConfirmationEmail(toEmailData(appointment, shop), cancelOptionFor(appointment));
    await deliver(config, {
      appointmentId: appointment.id,
      to: appointment.customerEmail,
      kind: EMAIL_KINDS.bookingConfirmation,
      email,
    });
  } catch (error) {
    console.error("[email] sendBookingConfirmationEmail", error);
  }
};

/** Tells the customer the shop cancelled their appointment. Never throws. */
export const sendStaffCancellationEmail = async (appointmentId: string) => {
  try {
    const config = getEmailConfig();
    if (!config) {
      console.info("[email] Not configured; skipping cancellation notice", appointmentId);
      return;
    }

    const appointment = await loadAppointment(appointmentId);
    if (!appointment?.customerEmail || appointment.status !== "CANCELLED") return;

    const shop = await loadShopDetails();
    await deliver(config, {
      appointmentId: appointment.id,
      to: appointment.customerEmail,
      kind: EMAIL_KINDS.staffCancellation,
      email: staffCancellationEmail(toEmailData(appointment, shop)),
      // Keyed on the cancellation itself, so a later cancel of the same appointment still notifies
      idempotencyKey: `${EMAIL_KINDS.staffCancellation}/${appointment.id}/${appointment.cancelledAt?.getTime() ?? 0}`,
    });
  } catch (error) {
    console.error("[email] sendStaffCancellationEmail", error);
  }
};

export interface ReminderRunSummary {
  date: string;
  sent: number;
  failed: number;
  /** Already reminded today, or the appointment time has passed */
  skipped: number;
}

/**
 * Reminds every customer with a confirmed appointment today (shop time). Safe to run more than
 * once a day: appointments that already got a reminder are skipped, and a failed one is retried.
 */
export const sendTodayReminderEmails = async (): Promise<ReminderRunSummary> => {
  const dateKey = toShopDateKey();
  const summary: ReminderRunSummary = { date: dateKey, sent: 0, failed: 0, skipped: 0 };

  const config = getEmailConfig();
  if (!config) {
    console.info("[email] Not configured; skipping reminders for", dateKey);
    return summary;
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      date: dateKeyToDbDate(dateKey),
      status: "CONFIRMED",
      deletedAt: null,
      customerEmail: { not: null },
      messages: { none: { kind: EMAIL_KINDS.reminder, status: "SENT" } },
    },
    orderBy: { time: "asc" },
    select: appointmentSelect,
  });
  if (appointments.length === 0) return summary;

  const shop = await loadShopDetails();
  const now = shopNowMinutes();

  for (const [i, appointment] of appointments.entries()) {
    // If the job runs late, don't remind people whose appointment already started
    if (!appointment.customerEmail || timeToMinutes(appointment.time) <= now) {
      summary.skipped++;
      continue;
    }
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS));

    const email = appointmentReminderEmail(toEmailData(appointment, shop), cancelOptionFor(appointment));
    const ok = await deliver(config, {
      appointmentId: appointment.id,
      to: appointment.customerEmail,
      kind: EMAIL_KINDS.reminder,
      email,
    });
    if (ok) summary.sent++;
    else summary.failed++;
  }

  return summary;
};
