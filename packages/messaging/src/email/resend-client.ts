import "server-only";

import type { SendResult } from "../whatsapp-client";

const RESEND_URL = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 10_000;
const SENDER_NAME = "DS Studio";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Resend drops a repeated send with the same key (24 h), so retries never email twice */
  idempotencyKey?: string;
}

export interface EmailConfig {
  apiKey: string;
  from: string;
}

/** Email is optional: until RESEND_API_KEY and BOOKING_EMAIL_FROM are set, sending is skipped (logged). */
export const getEmailConfig = (): EmailConfig | null => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;

  // A bare address shows up as "contacto" in inboxes; give it the shop's name
  return { apiKey, from: from.includes("<") ? from : `${SENDER_NAME} <${from}>` };
};

/** Sends one email through Resend's HTTPS API (Railway blocks SMTP). Never throws. */
export const sendEmail = async (config: EmailConfig, message: EmailMessage): Promise<SendResult> => {
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: config.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { id?: string };
    return data.id ? { ok: true, messageId: data.id } : { ok: false, error: "Resend returned no id" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};
