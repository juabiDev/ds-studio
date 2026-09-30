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

/** Where customers can book again; used in replies and templates. */
export const getPublicSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://dsstudio.example.com";
