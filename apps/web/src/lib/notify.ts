import "server-only";

import { getEmailConfig, sendEmail } from "@ds-studio/messaging/email";

interface BookingNotice {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  barberName: string;
  dateLabel: string;
  time: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails the shop via Resend. Configure RESEND_API_KEY, BOOKING_NOTIFY_EMAIL and
 * BOOKING_EMAIL_FROM; until then it only logs. Failures never affect the booking itself.
 */
const notifyShop = async (heading: string, notice: BookingNotice) => {
  const config = getEmailConfig();
  const to = process.env.BOOKING_NOTIFY_EMAIL;

  const summary = `${notice.serviceName} con ${notice.barberName} · ${notice.dateLabel} ${notice.time} hs`;

  if (!config || !to) {
    console.info(`[booking] ${heading}: ${notice.customerName} (${notice.customerPhone}) — ${summary}`);
    return;
  }

  const html = `
    <h2>${escapeHtml(heading)}</h2>
    <p><strong>${escapeHtml(summary)}</strong></p>
    <p>Cliente: ${escapeHtml(notice.customerName)}<br/>Teléfono: ${escapeHtml(notice.customerPhone)}</p>
  `;

  const result = await sendEmail(config, {
    to: to.split(",").map((e) => e.trim()),
    subject: `${heading}: ${summary}`,
    html,
    text: [heading, summary, `Cliente: ${notice.customerName}`, `Teléfono: ${notice.customerPhone}`].join("\n"),
  });
  if (!result.ok) console.error("[notifyShop]", result.error);
};

export const notifyNewBooking = (notice: BookingNotice) => notifyShop("Nuevo turno", notice);

export const notifyCustomerCancellation = (notice: BookingNotice) =>
  notifyShop("Turno cancelado por el cliente", notice);
