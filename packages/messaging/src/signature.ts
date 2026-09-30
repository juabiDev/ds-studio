import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Meta signs every webhook with HMAC-SHA256 of the raw body using the app secret and sends it
 * as `X-Hub-Signature-256: sha256=<hex>`. Must run on the exact raw body, before JSON parsing.
 */
export const isValidWebhookSignature = (rawBody: string, header: string | null, appSecret: string) => {
  if (!header?.startsWith("sha256=")) return false;

  const received = Buffer.from(header.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();

  // Constant-time comparison so the signature can't be guessed byte by byte
  return received.length === expected.length && timingSafeEqual(received, expected);
};

/**
 * appsecret_proof: HMAC-SHA256 of the access token keyed with the app secret. With "Require App
 * Secret" enabled in the Meta app, a leaked token is useless without the secret.
 */
export const appSecretProof = (accessToken: string, appSecret: string) =>
  createHmac("sha256", appSecret).update(accessToken).digest("hex");
