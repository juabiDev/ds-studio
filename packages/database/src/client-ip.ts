// Client IP for rate limiting, shared by the web and admin apps.
//
// Railway's edge always overwrites X-Real-IP with the connecting address, so it's the default.
// If another proxy sits in front of Railway (e.g. Cloudflare with the orange cloud on), that
// header holds the proxy's IP instead: set CLIENT_IP_HEADER=cf-connecting-ip so customers don't
// all share one rate-limit bucket. X-Forwarded-For is only used in development: clients can forge
// it, so in production a missing trusted header means "unknown IP" rather than a spoofable one.

interface HeaderReader {
  get: (name: string) => string | null;
}

export const getClientIpFromHeaders = (headers: HeaderReader): string | null => {
  const trustedHeader = process.env.CLIENT_IP_HEADER?.trim().toLowerCase() || "x-real-ip";
  const trusted = headers.get(trustedHeader)?.trim();
  if (trusted) return trusted;
  if (process.env.NODE_ENV === "production") return null;
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
};
