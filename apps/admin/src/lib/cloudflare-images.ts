import "server-only";

import { z } from "zod";

// Cloudflare Images "direct creator upload": the server asks Cloudflare for a one-time upload
// URL, the browser posts the file straight there (no file bytes pass through our server), then
// the server re-reads the image from Cloudflare before saving it, so nothing the browser reports
// about the upload is trusted.

const API_BASE = "https://api.cloudflare.com/client/v4/accounts";

/** Upload URLs stop working after this long. */
const UPLOAD_URL_TTL_MS = 30 * 60_000;

export type ImagePurpose = "gallery" | "barber";

const getConfig = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
  return accountId && token ? { accountId, token } : null;
};

export const isImageUploadConfigured = () => getConfig() !== null;

const envelope = <T extends z.ZodType>(result: T) =>
  z.object({ success: z.boolean(), result: result.nullable().optional() });

const directUploadSchema = envelope(z.object({ id: z.string(), uploadURL: z.url() }));

const imageSchema = envelope(
  z.object({
    id: z.string(),
    // Every variant as a full delivery URL: https://imagedelivery.net/<hash>/<id>/<variant>
    variants: z.array(z.url()),
    draft: z.boolean().optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
  }),
);

const cfFetch = async (path: string, init?: RequestInit) => {
  const config = getConfig();
  if (!config) throw new Error("Cloudflare Images is not configured");

  return fetch(`${API_BASE}/${config.accountId}/images${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${config.token}` },
    signal: AbortSignal.timeout(15_000),
  });
};

/** One-time URL the browser uploads a single file to. Null when uploads aren't configured or Cloudflare fails. */
export const createDirectUpload = async (purpose: ImagePurpose) => {
  if (!getConfig()) return null;

  const body = new FormData();
  body.set("requireSignedURLs", "false");
  body.set("expiry", new Date(Date.now() + UPLOAD_URL_TTL_MS).toISOString());
  // Checked again when the upload is saved, so a gallery URL can't be used for something else
  body.set("metadata", JSON.stringify({ app: "ds-studio-admin", purpose }));

  const res = await cfFetch("/v2/direct_upload", { method: "POST", body });
  const parsed = directUploadSchema.safeParse(await res.json().catch(() => null));
  if (!res.ok || !parsed.success || !parsed.data.success || !parsed.data.result) {
    console.error("[cloudflare-images] direct_upload failed", res.status);
    return null;
  }
  return parsed.data.result;
};

export interface UploadedImage {
  /** Default delivery URL ("public" variant when it exists) */
  imageUrl: string;
  /** variant name -> URL, stored in Thumbnail.variants */
  variants: Record<string, string>;
  defaultVariant: string;
}

/**
 * Confirms the image finished uploading through one of our own upload URLs for this purpose,
 * and returns its delivery URLs. Null when it doesn't exist, is still a draft, or doesn't match.
 */
export const getUploadedImage = async (imageId: string, purpose: ImagePurpose): Promise<UploadedImage | null> => {
  const res = await cfFetch(`/v1/${encodeURIComponent(imageId)}`);
  const parsed = imageSchema.safeParse(await res.json().catch(() => null));
  if (!res.ok || !parsed.success || !parsed.data.result) return null;

  const image = parsed.data.result;
  if (image.draft || image.meta?.app !== "ds-studio-admin" || image.meta?.purpose !== purpose) return null;

  const variants = Object.fromEntries(image.variants.map((url) => [url.split("/").at(-1) ?? "public", url]));
  const defaultVariant = "public" in variants ? "public" : Object.keys(variants)[0];
  if (!defaultVariant) return null;

  return { imageUrl: variants[defaultVariant], variants, defaultVariant };
};
