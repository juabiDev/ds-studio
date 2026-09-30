import "server-only";

// Better Auth rate-limits requests to its HTTP endpoints, but server actions call auth.api.*
// directly and skip that limiter, so the admin login applies its own. In-memory per server
// instance, like Better Auth's default storage: fine for a single Railway instance.

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, number[]>();

/** Records an attempt for each key; true when any key went over MAX_ATTEMPTS in the window. */
export const isLoginRateLimited = (keys: string[], now = Date.now()) => {
  let limited = false;

  for (const key of keys) {
    const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    attempts.set(key, recent);
    if (recent.length > MAX_ATTEMPTS) limited = true;
  }

  // Keep memory bounded: drop keys with no recent attempts
  if (attempts.size > 10_000) {
    for (const [key, times] of attempts) if (times.every((t) => now - t >= WINDOW_MS)) attempts.delete(key);
  }

  return limited;
};
