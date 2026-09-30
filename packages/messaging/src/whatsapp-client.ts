import "server-only";

import type { WhatsAppConfig } from "./config";
import { appSecretProof } from "./signature";

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string };

interface TemplateMessage {
  /** E.164 phone, e.g. +59899123456 */
  to: string;
  template: string;
  /** Named body parameters, matching {{name}} placeholders in the approved template */
  body: Record<string, string>;
  /** Payloads for the template's quick-reply buttons, in button order */
  quickReplyPayloads?: string[];
}

const REQUEST_TIMEOUT_MS = 10_000;

const post = async (config: WhatsAppConfig, payload: Record<string, unknown>): Promise<SendResult> => {
  const url = new URL(`${config.apiBaseUrl}/${config.graphVersion}/${config.phoneNumberId}/messages`);
  url.searchParams.set("appsecret_proof", appSecretProof(config.accessToken, config.appSecret));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const data = (await res.json().catch(() => ({}))) as {
      messages?: { id: string }[];
      error?: { code?: number; message?: string };
    };

    const messageId = data.messages?.[0]?.id;
    if (res.ok && messageId) return { ok: true, messageId };

    // Meta's error message never contains the token; safe to store for debugging
    return { ok: false, error: `${res.status} ${data.error?.code ?? ""} ${data.error?.message ?? "unknown error"}`.trim() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "request failed" };
  }
};

/** Graph API wants the number without "+" */
const toWaId = (e164: string) => e164.replace(/^\+/, "");

export const sendTemplate = (config: WhatsAppConfig, message: TemplateMessage) =>
  post(config, {
    to: toWaId(message.to),
    type: "template",
    template: {
      name: message.template,
      language: { code: config.templateLanguage },
      components: [
        {
          type: "body",
          parameters: Object.entries(message.body).map(([name, text]) => ({
            type: "text",
            parameter_name: name,
            text,
          })),
        },
        ...(message.quickReplyPayloads ?? []).map((payload, index) => ({
          type: "button",
          sub_type: "quick_reply",
          index: String(index),
          parameters: [{ type: "payload", payload }],
        })),
      ],
    },
  });

/** Free-form text. Only allowed within 24h of the customer's last message (e.g. right after a button tap). */
export const sendText = (config: WhatsAppConfig, to: string, body: string) =>
  post(config, { to: toWaId(to), type: "text", text: { body, preview_url: false } });
