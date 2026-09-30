import "server-only";

interface BookingNotice {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  barberName: string;
  dateLabel: string;
  time: string;
}

const RESEND_URL = "https://api.resend.com/emails";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails the shop via Resend. Configure RESEND_API_KEY, BOOKING_NOTIFY_EMAIL and
 * BOOKING_EMAIL_FROM; until then it only logs. Failures never affect the booking itself.
 */
const notifyShop = async (heading: string, notice: BookingNotice) => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BOOKING_NOTIFY_EMAIL;
  const from = process.env.BOOKING_EMAIL_FROM;

  const summary = `${notice.serviceName} con ${notice.barberName} · ${notice.dateLabel} ${notice.time} hs`;

  if (!apiKey || !to || !from) {
    console.info(`[booking] ${heading}: ${notice.customerName} (${notice.customerPhone}) — ${summary}`);
    return;
  }

  const html = `
    <h2>${escapeHtml(heading)}</h2>
    <p><strong>${escapeHtml(summary)}</strong></p>
    <p>Cliente: ${escapeHtml(notice.customerName)}<br/>Teléfono: ${escapeHtml(notice.customerPhone)}</p>
  `;

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: to.split(",").map((e) => e.trim()), subject: `${heading}: ${summary}`, html }),
    });
    if (!res.ok) console.error("[notifyShop] Resend responded", res.status, await res.text());
  } catch (error) {
    console.error("[notifyShop]", error);
  }
};

export const notifyNewBooking = (notice: BookingNotice) => notifyShop("Nuevo turno", notice);

export const notifyCustomerCancellation = (notice: BookingNotice) =>
  notifyShop("Turno cancelado por el cliente", notice);
