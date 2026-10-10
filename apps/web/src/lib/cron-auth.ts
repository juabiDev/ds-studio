import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** Hashing first gives equal-length buffers, so the comparison is constant-time for any input. */
const secretsMatch = (given: string, expected: string) =>
  timingSafeEqual(createHash("sha256").update(given).digest(), createHash("sha256").update(expected).digest());

/**
 * Cron endpoints require `Authorization: Bearer <CRON_SECRET>`. Returns the status to answer with
 * when the request isn't allowed, or null when it is. Without a secret the endpoints don't exist
 * (404), so they can never be triggered by accident.
 */
export const cronAuthFailure = (request: NextRequest): 401 | 404 | null => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return 404;

  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return secretsMatch(given, secret) ? null : 401;
};
