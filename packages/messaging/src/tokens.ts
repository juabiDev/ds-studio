import { createHash, randomBytes } from "node:crypto";

/**
 * Unguessable token carried by the WhatsApp buttons of one appointment. Only its hash is stored,
 * so a database leak doesn't reveal usable tokens; the webhook also checks the sender's phone.
 */
export const createActionToken = () => {
  const token = randomBytes(18).toString("base64url"); // 144 bits
  return { token, hash: hashActionToken(token) };
};

export const hashActionToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type ButtonAction = "confirm" | "cancel";

export const buttonPayload = (action: ButtonAction, token: string) => `${action}:${token}`;

export const parseButtonPayload = (payload: string): { action: ButtonAction; token: string } | null => {
  const match = /^(confirm|cancel):([A-Za-z0-9_-]{16,64})$/.exec(payload);
  return match ? { action: match[1] as ButtonAction, token: match[2] } : null;
};
