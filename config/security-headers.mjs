// Security headers shared by the web and admin apps (imported from each next.config.mjs).
//
// script-src keeps 'unsafe-inline' because the App Router injects inline bootstrap scripts and a
// nonce-based CSP would force every page to render dynamically (losing the home page's ISR cache).
// The rest of the policy still blocks foreign scripts, framing, plugins and form hijacking.

const isDev = process.env.NODE_ENV !== "production";

/**
 * @param {{ script?: string[]; connect?: string[]; img?: string[]; frame?: string[] }} sources
 *   Extra origins per directive, on top of 'self'.
 */
const buildCsp = ({ script = [], connect = [], img = [], frame = [] }) =>
  [
    "default-src 'self'",
    // Dev needs eval for React Refresh and a websocket for HMR
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${img.join(" ")}`,
    "font-src 'self'",
    `connect-src 'self' ${isDev ? "ws: wss:" : ""} ${connect.join(" ")}`,
    `frame-src ${frame.length ? frame.join(" ") : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ]
    .map((directive) => directive.replace(/\s+/g, " ").trim())
    .join("; ");

/**
 * @param {Parameters<typeof buildCsp>[0] & { noindex?: boolean }} options
 * @returns {{ key: string; value: string }[]}
 */
export const securityHeaders = ({ noindex = false, ...sources } = {}) => [
  { key: "Content-Security-Policy", value: buildCsp(sources) },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy twin of frame-ancestors for old browsers
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ...(noindex ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
];
