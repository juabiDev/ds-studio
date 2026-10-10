import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** Hashing first gives equal-length buffers, so the comparison is constant-time for any input. */
const secretsMatch = (given: string, expected: string) =>
  timingSafeEqual(createHash("sha256").update(given).digest(), createHash("sha256").update(expected).digest());

/**
 * Internal endpoints (cron jobs, cache refresh from the admin) require `Authorization: Bearer <secret>`.
 * Returns the status to answer with when the request isn't allowed, or null when it is. Without a
 * configured secret the endpoint doesn't exist (404), so it can never be triggered by accident.
 */
export const bearerAuthFailure = (request: NextRequest, secret: string | undefined): 401 | 404 | null => {
  if (!secret) return 404;

  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return secretsMatch(given, secret) ? null : 401;
};
