import "server-only";

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  webhookVerifyToken: string;
  graphVersion: string;
  templateLanguage: string;
  /** Only overridden in local tests (mock Graph API); production always talks to Meta */
  apiBaseUrl: string;
}

/**
 * WhatsApp is optional: until every credential is set, sending is skipped (logged) and the
 * webhook answers 404. All values come from server-side env vars, never the client bundle.
 */
export const getWhatsAppConfig = (): WhatsAppConfig | null => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!phoneNumberId || !accessToken || !appSecret || !webhookVerifyToken) return null;

  return {
    phoneNumberId,
    accessToken,
    appSecret,
    webhookVerifyToken,
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION ?? "v26.0",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "es",
    apiBaseUrl: process.env.WHATSAPP_API_BASE_URL ?? "https://graph.facebook.com",
  };
};

/**
 * Where customers can book again; used in replies, templates and cancel links. Null when unset in
 * production (logged): messages still go out, just without site links or a cancel button, rather
 * than with links to a wrong domain. The admin app also sends messages, so its own Railway domain
 * is not a usable fallback here.
 */
export const getPublicSiteUrl = (): string | null => {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url) return url;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  console.error("[messaging] NEXT_PUBLIC_SITE_URL is not set; sending without site links");
  return null;
};
