import "server-only";

import { Prisma, prisma, type MessageStatus } from "@ds-studio/database";
import { normalizePhone } from "@ds-studio/database/booking";
import { dbDateToKey, shopNowMinutes, timeToMinutes, toShopDateKey } from "@ds-studio/database/dates";

import { getPublicSiteUrl, getWhatsAppConfig, type WhatsAppConfig } from "./config";
import { isValidWebhookSignature } from "./signature";
import { firstName, formatLongDate } from "./format";
import { hashActionToken, parseButtonPayload } from "./tokens";
import { sendText } from "./whatsapp-client";

// Only the fields this app reads; everything else in Meta's payload is ignored.
interface InboundMessage {
  id: string;
  from: string;
  type: string;
  button?: { payload?: string; text?: string };
  interactive?: { type?: string; button_reply?: { id?: string } };
}

interface StatusUpdate {
  id: string;
  status: string;
  errors?: { code?: number; title?: string; message?: string }[];
}

interface WebhookPayload {
  object?: string;
  entry?: { changes?: { field?: string; value?: { messages?: InboundMessage[]; statuses?: StatusUpdate[] } }[] }[];
}

export interface CustomerCancellation {
  appointmentId: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  barberName: string;
  dateKey: string;
  time: string;
}

export type WebhookResult =
  | { status: 200; cancellations: CustomerCancellation[] }
  | { status: 401 | 404; cancellations: [] };

const STATUS_RANK: Record<MessageStatus, number> = { PENDING: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4, RECEIVED: 0 };
const META_STATUS: Record<string, MessageStatus> = { sent: "SENT", delivered: "DELIVERED", read: "READ", failed: "FAILED" };

/** GET handshake Meta performs when the webhook URL is registered. Returns the challenge or null. */
export const verifyWebhookSubscription = (params: URLSearchParams) => {
  const config = getWhatsAppConfig();
  if (!config) return null;

  const valid = params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === config.webhookVerifyToken;
  return valid ? (params.get("hub.challenge") ?? "") : null;
};

/**
 * Entry point for POST /api/whatsapp/webhook. The signature is checked on the raw body before
 * anything is parsed, so forged requests (e.g. fake "cancel" taps) are rejected with 401.
 */
export const handleWhatsAppWebhook = async (rawBody: string, signature: string | null): Promise<WebhookResult> => {
  const config = getWhatsAppConfig();
  if (!config) return { status: 404, cancellations: [] };
  if (!isValidWebhookSignature(rawBody, signature, config.appSecret)) return { status: 401, cancellations: [] };

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return { status: 200, cancellations: [] }; // signed but unparseable: nothing to do, don't make Meta retry
  }

  const cancellations: CustomerCancellation[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages" || !change.value) continue;

      for (const status of change.value.statuses ?? []) await applyStatusUpdate(status);
      for (const message of change.value.messages ?? []) {
        const cancellation = await handleInboundMessage(config, message);
        if (cancellation) cancellations.push(cancellation);
      }
    }
  }

  return { status: 200, cancellations };
};

/** Delivery receipts can arrive out of order, so a status only moves forward (FAILED always wins). */
const applyStatusUpdate = async (update: StatusUpdate) => {
  const next = META_STATUS[update.status];
  if (!next || !update.id) return;

  const log = await prisma.messageLog.findUnique({ where: { providerMessageId: update.id } });
  if (!log || log.status === "FAILED" || STATUS_RANK[next] <= STATUS_RANK[log.status]) return;

  const error = update.errors?.[0];
  await prisma.messageLog.update({
    where: { id: log.id },
    data: {
      status: next,
      error: next === "FAILED" && error ? `${error.code ?? ""} ${error.title ?? error.message ?? ""}`.trim().slice(0, 500) : log.error,
    },
  });
};

const buttonPayloadOf = (message: InboundMessage) =>
  message.type === "button" ? message.button?.payload : message.interactive?.button_reply?.id;

const handleInboundMessage = async (
  config: WhatsAppConfig,
  message: InboundMessage,
): Promise<CustomerCancellation | null> => {
  if (!message.id || !message.from) return null;

  // Dedupe: Meta may deliver the same webhook more than once; the unique id makes the insert fail
  let inboundLogId: string;
  try {
    const log = await prisma.messageLog.create({
      data: {
        channel: "WHATSAPP",
        direction: "INBOUND",
        kind: buttonPayloadOf(message) ? "button_reply" : "message",
        providerMessageId: message.id,
        status: "RECEIVED",
      },
    });
    inboundLogId = log.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }

  try {
    return await processButtonTap(config, message, inboundLogId);
  } catch (error) {
    // Let Meta's retry reprocess it: remove the dedupe row, then surface the error (500)
    await prisma.messageLog.delete({ where: { id: inboundLogId } }).catch(() => undefined);
    throw error;
  }
};

const processButtonTap = async (
  config: WhatsAppConfig,
  message: InboundMessage,
  inboundLogId: string,
): Promise<CustomerCancellation | null> => {
  // Plain texts, audios, etc. are left for staff to answer in the WhatsApp Business app
  const parsed = parseButtonPayload(buttonPayloadOf(message) ?? "");
  if (!parsed) return null;

  const appointment = await prisma.appointment.findUnique({
    where: { actionTokenHash: hashActionToken(parsed.token) },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      date: true,
      time: true,
      status: true,
      customerConfirmedAt: true,
      deletedAt: true,
      service: { select: { name: true } },
      employee: { select: { name: true } },
    },
  });

  // The token must belong to an appointment booked with the same phone that tapped the button
  const senderPhone = normalizePhone(`+${message.from}`);
  if (!appointment || appointment.deletedAt || appointment.customerPhone !== senderPhone) {
    console.warn("[whatsapp] Ignored button tap with unknown token or mismatched phone");
    return null;
  }

  await prisma.messageLog.update({ where: { id: inboundLogId }, data: { appointmentId: appointment.id } });

  const dateKey = dbDateToKey(appointment.date);
  const today = toShopDateKey();
  const isPast = dateKey < today || (dateKey === today && timeToMinutes(appointment.time) <= shopNowMinutes());
  const name = firstName(appointment.customerName);
  const when = `${formatLongDate(dateKey)} a las ${appointment.time} hs`;
  const site = getPublicSiteUrl();
  const bookAgain = site ? `Si quieres reservar otro horario: ${site}` : "Si quieres reservar otro horario, responde este mensaje.";

  const reply = async (text: string) => {
    const result = await sendText(config, senderPhone, text);
    await prisma.messageLog.create({
      data: {
        appointmentId: appointment.id,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        kind: "auto_reply",
        providerMessageId: result.ok ? result.messageId : null,
        status: result.ok ? "SENT" : "FAILED",
        error: result.ok ? null : result.error.slice(0, 500),
      },
    });
  };

  if (appointment.status === "CANCELLED") {
    await reply(`Ese turno ya estaba cancelado. ${bookAgain}`);
    return null;
  }
  if (appointment.status !== "CONFIRMED" || isPast) {
    await reply(`Ese turno ya pasó. ${bookAgain}`);
    return null;
  }

  if (parsed.action === "confirm") {
    if (!appointment.customerConfirmedAt) {
      await prisma.appointment.update({ where: { id: appointment.id }, data: { customerConfirmedAt: new Date() } });
    }
    await reply(`¡Gracias, ${name}! Te esperamos el ${when}. Si no puedes venir, toca "Cancelar turno" en el mensaje anterior.`);
    return null;
  }

  // Conditional update: two taps racing can only cancel once
  const { count } = await prisma.appointment.updateMany({
    where: { id: appointment.id, status: "CONFIRMED" },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy: "CUSTOMER" },
  });
  if (count === 0) return null;

  await reply(`Listo, ${name}. Cancelamos tu turno de ${appointment.service.name} del ${when}. ${bookAgain}`);

  return {
    appointmentId: appointment.id,
    customerName: appointment.customerName,
    customerPhone: senderPhone,
    serviceName: appointment.service.name,
    barberName: appointment.employee.name,
    dateKey,
    time: appointment.time,
  };
};
