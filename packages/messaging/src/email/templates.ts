// Local email templates (Spanish, neutral "tú"). Kept as plain HTML strings with inline styles and
// tables, which is what email clients (Gmail, Outlook) render reliably. Can later move to Resend templates.

export interface AppointmentEmailData {
  firstName: string;
  serviceName: string;
  barberName: string;
  /** "martes 29 de septiembre" */
  dateLabel: string;
  /** "10:00" */
  time: string;
  shop: {
    address: string;
    phone: string;
    whatsappUrl: string;
    mapsUrl: string;
    /** Null when the public site URL isn't configured; site links are left out */
    siteUrl: string | null;
  };
}

/** Self-service cancel link; null when it's too late to cancel online or links aren't configured. */
export type CancelOption = { url: string; cutoffHours: number } | null;

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface EmailAction {
  href: string;
  label: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const FONT = "font-family:Helvetica,Arial,sans-serif;";

const detailRow = (label: string, value: string) => `
  <tr>
    <td style="${FONT}padding:10px 0;border-bottom:1px solid #e5e5e5;color:#737373;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(label)}</td>
    <td align="right" style="${FONT}padding:10px 0;border-bottom:1px solid #e5e5e5;color:#0a0a0a;font-size:15px;font-weight:bold;">${escapeHtml(value)}</td>
  </tr>`;

const button = ({ href, label }: EmailAction) => `
  <a href="${escapeHtml(href)}" style="${FONT}display:inline-block;margin:4px;padding:12px 22px;background:#0a0a0a;color:#ffffff;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">${escapeHtml(label)}</a>`;

const cancelButton = (href: string) => `
  <a href="${escapeHtml(href)}" style="${FONT}display:inline-block;margin:4px;padding:11px 21px;border:1px solid #d4d4d4;color:#525252;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">Cancelar turno</a>`;

interface LayoutOptions {
  preheader: string;
  heading: string;
  /** HTML; escape any dynamic value */
  intro: string;
  data: AppointmentEmailData;
  /** HTML; escape any dynamic value */
  closing: string;
  actions: EmailAction[];
  cancelUrl?: string;
}

const layout = ({ preheader, heading, intro, data, closing, actions, cancelUrl }: LayoutOptions) => `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;">
          <tr>
            <td align="center" style="${FONT}background:#0a0a0a;padding:28px 24px;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:6px;">DS STUDIO</td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;">
              <h1 style="${FONT}margin:0 0 12px;color:#0a0a0a;font-size:24px;">${escapeHtml(heading)}</h1>
              <p style="${FONT}margin:0 0 20px;color:#404040;font-size:15px;line-height:1.6;">${intro}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${detailRow("Servicio", data.serviceName)}
                ${detailRow("Barbero", data.barberName)}
                ${detailRow("Fecha", data.dateLabel)}
                ${detailRow("Hora", `${data.time} hs`)}
              </table>
              <p style="${FONT}margin:24px 0 0;color:#404040;font-size:14px;line-height:1.6;">
                📍 ${escapeHtml(data.shop.address)}
              </p>
              <p style="${FONT}margin:16px 0 0;color:#404040;font-size:14px;line-height:1.6;">${closing}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 24px 32px;">
              ${actions.map(button).join("")}
              ${cancelUrl ? `<br />${cancelButton(cancelUrl)}` : ""}
            </td>
          </tr>
          <tr>
            <td align="center" style="${FONT}padding:20px 24px;border-top:1px solid #e5e5e5;color:#a3a3a3;font-size:12px;line-height:1.6;">
              DS Studio · ${escapeHtml(data.shop.address)} · ${escapeHtml(data.shop.phone)}
              ${data.shop.siteUrl ? `<br /><a href="${escapeHtml(data.shop.siteUrl)}" style="color:#a3a3a3;">${escapeHtml(data.shop.siteUrl.replace(/^https?:\/\//, ""))}</a>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const textDetails = (data: AppointmentEmailData) =>
  [
    `Servicio: ${data.serviceName}`,
    `Barbero: ${data.barberName}`,
    `Fecha: ${data.dateLabel}`,
    `Hora: ${data.time} hs`,
    `Dirección: ${data.shop.address}`,
  ].join("\n");

const footerText = (data: AppointmentEmailData) => ["DS Studio", data.shop.siteUrl].filter(Boolean).join(" · ");

const visitActions = (data: AppointmentEmailData): EmailAction[] => [
  { href: data.shop.mapsUrl, label: "Cómo llegar" },
  { href: data.shop.whatsappUrl, label: "WhatsApp" },
];

const cancelNotice = (cancel: CancelOption) =>
  cancel
    ? `Si no puedes venir, puedes cancelar el turno con el botón de abajo hasta ${cancel.cutoffHours} horas antes.`
    : "Si no puedes venir, avísanos por WhatsApp para darle el lugar a otra persona.";

/** Sent right after the booking is made (online or by staff). */
export const bookingConfirmationEmail = (data: AppointmentEmailData, cancel: CancelOption): RenderedEmail => {
  const changeNotice = `¿Necesitas cambiar el horario? Escríbenos por WhatsApp (${data.shop.phone}) o responde este correo.`;

  return {
    subject: `Turno confirmado: ${data.dateLabel} a las ${data.time} hs`,
    html: layout({
      preheader: `${data.serviceName} con ${data.barberName}, ${data.dateLabel} a las ${data.time} hs.`,
      heading: `¡Listo, ${data.firstName}!`,
      intro: "Tu turno en <strong>DS Studio</strong> está reservado. Estos son los detalles:",
      data,
      closing: `${escapeHtml(changeNotice)} ${escapeHtml(cancelNotice(cancel))}<br />¡Te esperamos!`,
      actions: visitActions(data),
      cancelUrl: cancel?.url,
    }),
    text: [
      `¡Listo, ${data.firstName}!`,
      "",
      "Tu turno en DS Studio está reservado:",
      "",
      textDetails(data),
      "",
      changeNotice,
      cancel ? `Si no puedes venir, cancélalo aquí hasta ${cancel.cutoffHours} horas antes: ${cancel.url}` : cancelNotice(cancel),
      "¡Te esperamos!",
      "",
      footerText(data),
    ].join("\n"),
  };
};

/** Sent by the daily 8:00 job to everyone with an appointment that day. */
export const appointmentReminderEmail = (data: AppointmentEmailData, cancel: CancelOption): RenderedEmail => {
  const arrivalNotice = "Te pedimos llegar unos minutos antes.";

  return {
    subject: `Hoy tienes turno a las ${data.time} hs con ${data.barberName}`,
    html: layout({
      preheader: `Te esperamos hoy a las ${data.time} hs en DS Studio.`,
      heading: `¡Hoy nos vemos, ${data.firstName}!`,
      intro: `Te recordamos que hoy a las <strong>${escapeHtml(data.time)} hs</strong> tienes turno con <strong>${escapeHtml(data.barberName)}</strong>.`,
      data,
      closing: `${arrivalNotice} ${escapeHtml(cancelNotice(cancel))}`,
      actions: visitActions(data),
      cancelUrl: cancel?.url,
    }),
    text: [
      `¡Hoy nos vemos, ${data.firstName}!`,
      "",
      `Te recordamos que hoy a las ${data.time} hs tienes turno con ${data.barberName}.`,
      "",
      textDetails(data),
      "",
      arrivalNotice,
      cancel ? `Si no puedes venir, cancélalo aquí hasta ${cancel.cutoffHours} horas antes: ${cancel.url}` : cancelNotice(cancel),
      `WhatsApp: ${data.shop.phone}`,
      "",
      footerText(data),
    ].join("\n"),
  };
};

/** Sent when staff cancel the appointment from the admin. */
export const staffCancellationEmail = (data: AppointmentEmailData): RenderedEmail => {
  const bookUrl = data.shop.siteUrl ? `${data.shop.siteUrl.replace(/\/$/, "")}/#agendar` : null;
  const apology =
    "Disculpa las molestias. Puedes reservar un nuevo horario en nuestra web o escribirnos por WhatsApp y te ayudamos.";

  return {
    subject: `Tu turno del ${data.dateLabel} fue cancelado`,
    html: layout({
      preheader: `Tuvimos que cancelar tu turno del ${data.dateLabel} a las ${data.time} hs.`,
      heading: "Tu turno fue cancelado",
      intro: `Hola ${escapeHtml(data.firstName)}, lamentamos informarte que tuvimos que cancelar tu turno en <strong>DS Studio</strong>. Estos eran los detalles:`,
      data,
      closing: escapeHtml(apology),
      actions: [
        ...(bookUrl ? [{ href: bookUrl, label: "Reservar otro turno" }] : []),
        { href: data.shop.whatsappUrl, label: "WhatsApp" },
      ],
    }),
    text: [
      `Hola ${data.firstName},`,
      "",
      "Lamentamos informarte que tuvimos que cancelar tu turno en DS Studio:",
      "",
      textDetails(data),
      "",
      apology,
      `Reservar: ${bookUrl}`,
      `WhatsApp: ${data.shop.phone}`,
      "",
      footerText(data),
    ].join("\n"),
  };
};
